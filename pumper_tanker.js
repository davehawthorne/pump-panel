/*global widgets model modelComponents utils svg $*/
"use strict";

///
/// Notes:
///   All pressures are relative to atmospheric: 100kPa
///   Pressures given in kPa, flows in l/min



var logStuff = [];

var logger = function (a) {
    var i;
    logStuff += '<tr>';
    for (i in a) {
        if (typeof a[i] !== 'function') {
            logStuff += '<td>' + a[i] + '</td>';
        }
    }
    logStuff += '</tr>';
};


function daveThing(name, val) {
    $('#' + name).html('' + val);
}


//TEMP!!!
var showLog = function () {
    daveThing('compDuration', '<table>' + logStuff + '</table>');
    //TEMP!!! logStuff = '';
};




var handleException = function (ex) {
    var
        msg = "EX " + typeof ex + ' "' + ex.message + '" ' + ex.fileName + ':' + ex.lineNumber;
    alert(msg);
};


var svgDocument;

var svgns = "http://www.w3.org/2000/svg";
var xlinkNS = "http://www.w3.org/1999/xlink";

var active = {};  //TEMP!!!

var debugDisp = function (x, y, text) {
    var
        priv = {
            line: svg.document.createTextNode(text),
            baseText: text
        },
        textWid = svg.document.createElementNS(svgns, "text");
    utils.setAttrs(textWid, {
        "text-anchor": "middle",
        x: x,
        y: y,
        "font-family": "arial",
        fill: "red"
    });
    textWid.appendChild(priv.line);
    svg.document.documentElement.appendChild(textWid);
    return {
        set: function (text) {
            priv.line.nodeValue = priv.baseText + ":" + text;
        }
    };
};


var debug = {};


/*
    calc flow from branches based on branch pressure
    tally flow
    check delivery flow okay, hose and pump
    calc pres based on flow
    get mid point and repeat.





foreach open inlet
    get flow from pres
    and cap (and flag collapse)
    tally up


Once one line hits max flow then the combined flow can't increase
we can therefore calc max flow
if we hit max flow then we know inlet pressure and flow so can calc branch flow based on this






fmax = f(phy, hose)

*/

var model = (function () {
    var
        i, engine, flow, engineTick, attackLineFricLoss, supplyLineFricLoss,
        boost, al, outValve, inValve, pres, hydraulicTick, iterateFlow,
        hydrantParams,

        hydrantModel = {
            lengthResistance: modelComponents.hose.resistance.h65,
            lengths: 1,
            plumbResistance: 0
        },

        tank, tankOutOpen;

    attackLineFricLoss = [
        modelComponents.hose.fricLoss.curry(modelComponents.hose.resistance.h38, 1, 1),
        modelComponents.hose.fricLoss.curry(modelComponents.hose.resistance.h38, 2, 1),
        modelComponents.hose.fricLoss.curry(modelComponents.hose.resistance.h38, 3, 1),
        modelComponents.hose.fricLoss.curry(modelComponents.hose.resistance.h65, 3, 1)
    ];

    //TEMP!!!
    boost = modelComponents.gaam.mk450.normalPressureBoost;
    //TEMP!!! branch = [
    //TEMP!!!     modelComponents.branch.protek366(),
    //TEMP!!!     modelComponents.branch.protek366(),
    //TEMP!!!     modelComponents.branch.protek366(),
    //TEMP!!!     modelComponents.branch.protek366()
    //TEMP!!! ];

    // 5 values, 4 outlets and recirc
    outValve = [];
    for (i = 0; i < 5; i += 1) {
        outValve[i] = modelComponents.valve(500, 500);
    }

    al = [];
    for (i = 0; i < 4; i += 1) {
        al[i] = modelComponents.attackLine();

    }

    inValve = [
        modelComponents.valve(500, 1000), // left inlet at halfway 1kL/min flow drops 500kPa through valve
        modelComponents.valve(250, 1000), // greater flow though hard suction input
        modelComponents.valve(500, 1000) // right inlet same as left
    ];

    tank = modelComponents.tank({
        cap: 2000, //litres
        height: 1, // metres
        alarmLevel: 500 // litres
    });

    pres = {
        hydrant: 300.0, //kPa
        pumpEye: 0,
        pumpOut: 0,
        pumpHp: 0
    };

    engine = {
        state: 'off',
        rpm: 0,
        revInc: 0
    };

    flow = {
        total: 0,
        outlet: []
    };

    (function () {
        var outlet;  //TEMP!!!
        for (outlet = 0; outlet < 5; outlet += 1) {
            flow.outlet[outlet] = 0.0;
        }
    })();


    tankOutOpen = true;

    /// run every tick interval, checks if operator is adjusting throttle
    //TEMP!!! the revs are just guesses
    engineTick = function () {
        if (engine.state === "running") {
            switch (engine.revInc) {
            case 1:
                engine.rpm += 50;
                if (engine.rpm > 4000) {
                    active.modelFail.pulse();
                    // red-lining
                }
                break;
            case -1:
                engine.rpm -= 50;
                if (engine.rpm < 700) {
                    // can no longer stall pump
                    engine.rpm = 700;
                }
                break;
            }
        }
    };

    // Called once each tick.
    //
    //
    hydraulicTick = function () {
        var
            outlet,
            total = 0.0,
            hydrantParams = modelComponents.computeDeliveryLoss(pres.hydrant, hydrantModel, inValve);

        if (tankOutOpen) {
            if (hydrantParams.open) {
                active.modelFail.pulse();
            } else {
                if (tank.getWater() === 0.0) {
                    pres.pumpOut = 0.0;
                    active.cavitation.pulse();
                } else {
                    pres.pumpEye = 5 - 25e-6 * utils.sq(flow.total);     //TEMP!!! magic numbers 0.5m head 25 kPa loss at 1kL/min
                    pres.pumpOut = pres.pumpEye + boost(engine.rpm, flow.total);
                }
            }
        } else {   // tank valve closed
            if (hydrantParams.open) {
                if (flow.total > hydrantParams.maxFlow) {
                    active.hoseCollapse.pulse();
                    // hydrant line collapsing
                    //TEMP!!! flow.total = hydrantParams.maxFlow;
                    //TEMP!!! pres.pumpEye = 0.0;
                    pres.pumpEye = pres.hydrant - hydrantParams.equivResist * utils.sq(hydrantParams.maxFlow);
                } else {
                    pres.pumpEye = pres.hydrant - hydrantParams.equivResist * utils.sq(flow.total);
                }
            } else {
                active.modelFail.pulse();

                // there's no source water, if any outlet is open drop the pressure to 0

            }
        }



        if (pres.pumpEye < -100) {
            active.cavitation.pulse();
            pres.pumpEye = -100;
            pres.pumpOut = pres.pumpEye + boost(engine.rpm, flow.total) / 2;
        } else {
            pres.pumpOut = pres.pumpEye + boost(engine.rpm, flow.total);
        }
        for (outlet = 0; outlet < 5; outlet += 1) {
            if (outValve[outlet].closed()) {
                flow.outlet[outlet] = 0.0;
            } else {
                if (outlet < 4) {
                    // attack line
                    flow.outlet[outlet] = al[outlet].getFlow(pres.pumpOut);
                } else {
                    // tank fill
                    flow.outlet[outlet] = outValve[outlet].flowRate(pres.pumpOut, 10);  //TEMP!!! magic number
                    tank.fill(flow.outlet[outlet] / 600);
                }
            }

            total += flow.outlet[outlet];
        }

        flow.total = (flow.total + total) / 2;

        if (isNaN(flow.total)) {
            //TEMP!!!
            flow.total = 0;
        }

        if (tankOutOpen) {
            tank.draw(flow.total / 600);
        }

        logger([flow.outlet[0], flow.outlet[4], pres.pumpEye, pres.pumpOut, tank.getWater()]);


    };


    return {
        setHydrantLengths: function (l) {
            hydrantModel.lengths = l;
        },
        setHydrantPres: function (p) {   //TEMP!!!
            pres.hydrant = p;
        },
        setHydrantLineRise: function (h) {
        },
        setOutValve: function (index, value) {
            var totalRes;
            outValve[index].set(value);
            totalRes = outValve[index].resistance() + 1 / 650;    //TEMP!!! add a length of 38
            al[index].setHoseResistance(totalRes);
        },

        setInValve: function (index, value) {
            inValve[index].set(value);
        },

        startBut: function (on) {
            if (!on) {
                return;  // do nothing on release
                //TEMP!!! deal with holding on starter
            }
            switch (engine.state) {
            case "off":
                return; // without doing anything
            case "ready":
                engine.rpm = 800;
                engine.state = "running";
                return;

            }
        },

        onOff: function (on) {
            if (on) {
                engine.state = "ready";
            } else {
                engine.state = "off";
                engine.rpm = 0.0;
            }
        },

        revDown: function (on) {
            engine.revInc = on ? -1 : 0;
        },

        revUp: function (on) {
            engine.revInc = on ? 1 : 0;
        },

        tankIso: function (on) {
            tankOutOpen = on;
        },

        tick: function () {
            try {

                engineTick();
                hydraulicTick();
                daveThing('tankLevel', tank.getWater());
                daveThing('totalFlow', flow.total);
                daveThing('pumpPresOut', pres.pumpOut);
                daveThing('pumpPresEye', pres.pumpEye);
            }
            catch (ex) {
                handleException(ex);
            }

        },

        waterOn: function (index, on) {
            al[index].waterOn(on);
        },

        getPumpOutletPres: function () {
            return pres.pumpOut;
        },
        getPumpEyePres: function () {
            return pres.pumpEye;
        },

        getPumpHpOutPres: function () {
            return pres.pumpHp;
        },

        getEngineRpm: function () {
            return engine.rpm;
        },

        getTankLevel: function () {
            return tank.getLevel();
        },

        getOutletFlow: function (i) {
            return flow.outlet[i];
        }
    };
})();





var updatePanel = function () {
    var i;
    active.outGauge.showPressure(model.getPumpOutletPres());
    active.combGauge.showPressure(model.getPumpEyePres());
    active.hpGauge.showPressure(model.getPumpHpOutPres());
    active.revGauge.showPressure(model.getEngineRpm());
    for (i = 0; i < 5; i += 1) {
        active.outFlow[i].set(model.getOutletFlow(i));
    }
    active.waterLevel.set(model.getTankLevel());
};


var buildPumpPanel = function (jqSvg, svgDocument) {
    svg.setDocument(svgDocument);
    try {
        var
            de = svgDocument.documentElement,
            panel = svg.create("rect", {x: 0, y: 0, width: 1500, height: 800, fill: "#202020"}),
            hpCircle = svg.create("circle", {cx: 350, cy: 180, r: 90, fill: "blue"}),
            combCircle = svg.create("circle", {cx: 600, cy: 180, r: 90, fill: "green"}),
            outCircle = svg.create("circle", {cx: 850, cy: 180, r: 90, fill: "red"}),
            i,
            x,
            sideways,
            heart = utils.timerHeart(10);  // ten times per second

        active = {
            outGauge: widgets.gauges.outlet({parent: de, cx: 350, cy: 180, radius: 75}),
            combGauge: widgets.gauges.compound({parent: de, cx: 600, cy: 180, radius: 75}),
            hpGauge: widgets.gauges.highPressure({parent: de, cx: 850, cy: 180, radius: 75}),
            revGauge: widgets.gauges.engineRevs({parent: de, cx: 1025, cy: 180, radius: 50}),
            startBut: widgets.controls.pushButton({parent: de, cx: 550, cy: 450, width: 40, text: ["START"], callback: model.startBut}),
            onOff: widgets.controls.toggleSwitch({parent: de, cx: 625, cy: 450, width: 20, text: ["OFF-ON"], callback: model.onOff}),
            decreaseRevs: widgets.controls.pushButton({parent: de, cx: 700, cy: 450, width: 40, text: ["DEC."], callback: model.revDown}),
            increaseRevs: widgets.controls.pushButton({parent: de, cx: 775, cy: 450, width: 40, text: ["INC."], callback: model.revUp}),
            tankIso: widgets.controls.toggleSwitch({parent: de, cx: 1150, cy: 180, width: 20, text: ["WATER TANK", "ISO VALVE"], callback: model.tankIso, initial: true}),
            waterLevel: widgets.gauges.levelIndicator({cx: 1300, yTop: 50, lampDist: 50, title: "WATER"}),
            cavitation: widgets.gauges.lamp({cx: 600, cy: 325, rBevel: 29, rGlobe: 20, interval: 500, colour: [255, 0, 0]}),
            hoseCollapse: widgets.gauges.lamp({cx: 675, cy: 325, rBevel: 29, rGlobe: 20, interval: 500, colour: [0, 0, 255]}),
            modelFail: widgets.gauges.lamp({cx: 40, cy: 40, rBevel: 29, rGlobe: 20, interval: 500, colour: [0, 0, 255]})
        };

        active.waterLevel.set(0.5);
        active.outValue = [];
        active.outFlow = [];
        for (i = 0; i < 5; i += 1) {
            x = (i < 2) ? (250 + i * 200) : (450 + i * 200);
            sideways = (i < 2) ? (i - 2) * 10 : (i - 1) * 10;
            active.outValue[i] = widgets.controls.outletValve({
                yTop: 350,
                yBot: 500,
                knobWidth: 40,
                width: 100,
                height: 250,
                callback: model.setOutValve.curry(i),
                cx: x,
                sideways: sideways
            });
            active.outFlow[i] = widgets.gauges.flow({parent: de, cx: x, cy: 600, width: 70});
        }

        active.inValue = [];
        for (i = 0; i < 3; i += 1) {
            x = 350 + i * 290;
            sideways = -15 + i * 15;
            active.inValue[i] = widgets.controls.outletValve({
                yTop: 600,
                yBot: 700,
                knobWidth: 40,
                width: 100,
                height: 200,
                callback: model.setInValve.curry(i),
                cx: x,
                sideways: sideways
            });
        }

        heart.addCallback(model.tick);
        heart.addCallback(updatePanel);

        debug.felt = svg.create("rect", {parent: de, x: 1500, y: 0, width: 400, height: 800, fill: "#00AA22"});

        debug.bu = debugDisp(1800, 75, "but up");
        debug.val1 = debugDisp(1800, 100, "knobTopY");
        debug.val2 = debugDisp(1800, 125, "evt.y");
        debug.val3 = debugDisp(1800, 150, "priv.cursorToCentre");

        debug.of = debugDisp(1600, 75, "old flow");
        debug.ep = debugDisp(1600, 100, "eye pres");
        debug.pp = debugDisp(1600, 125, "pump pres");
        debug.op = debugDisp(1600, 150, "out pres");
        debug.bp = debugDisp(1600, 175, "branch pres");
        debug.bf0 = debugDisp(1600, 200, "branch flow 0");
        debug.bf1 = debugDisp(1600, 220, "branch flow 1");
        debug.bf2 = debugDisp(1600, 240, "branch flow 2");
        debug.bf3 = debugDisp(1600, 260, "branch flow 3");
        debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 350, width: 20, text: ["BRANCH0"], callback: model.waterOn.curry(0)});
        debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 400, width: 20, text: ["BRANCH1"], callback: model.waterOn.curry(1)});
        debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 450, width: 20, text: ["BRANCH2"], callback: model.waterOn.curry(2)});
        debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 500, width: 20, text: ["BRANCH3"], callback: model.waterOn.curry(3)});

        widgets.controls.pushButton({cx: 1600, cy: 550, width: 40, text: ["LOG"], callback: showLog});

        debug.timerInt = utils.timerInterface(jqSvg, 1600, 30, 50, heart);
        jqSvg.text(1510, 120, "hydrant line lengths");
        debug.hydrantLineLength = utils.numSpinner(jqSvg, 1700, 100, 100, 30, 1, 15, 1, 0, 1, function (x) {
            model.setHydrantLengths(x);
        });
        jqSvg.text(1510, 155, "hydrant pressure [kPa]");
        debug.hydrantPressure = utils.numSpinner(jqSvg, 1700, 135, 100, 30, 100, 1200, 100, 0, 500, function (x) {
            model.setHydrantPres(x);
        });
        jqSvg.text(1510, 190, "hydrant line rise [m]");
        debug.hydrantLineRise = utils.numSpinner(jqSvg, 1700, 170, 100, 30, -10, 10, 1, 0, 0, function (x) {
            model.setHydrantLineRise(x);
        });

        logger(['o0', 'o4', 'pres.pumpEye', 'pres.pumpOut', 'tank']);

        model.tick();
        updatePanel();

    }
    catch (ex) {
        handleException(ex);
    }
};






