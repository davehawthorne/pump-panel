/*global widgets model modelComponents utils svg paintPanel attachWidgets */
"use strict";

///
/// Notes:
///   All pressures are relative to atmospheric: 100kPa
///   Pressures given in kPa, flows in l/min





var svgDocument;
var svgns = "http://www.w3.org/2000/svg";
var xlinkNS = "http://www.w3.org/1999/xlink";


var
    panelItems,
    engine,
    flow = {},
    engineTick,
    attackLineFricLoss,
    supplyLineFricLoss,
    boost,
    attackLine, outValve, inValve, pres, hydraulicTick, iterateFlow,
    hydrantParams;

attackLineFricLoss = modelComponents.hose.fricLoss.curry(modelComponents.hose.resistance.h38, 1, 1);

boost = modelComponents.gaam.mk450.normalPressureBoost;

outValve = modelComponents.valve(500, 500);
attackLine = modelComponents.attackLine();
inValve = modelComponents.valve(500, 1000); // inlet at halfway 1kL/min flow drops 500kPa through valve

pres = {
    hydrant: 300.0, //kPa
    pumpEye: 0,
    pumpOut: 0,
    pumpHp: 0
};

engine = {
    rpm: 800,
    revInc: 0
};

flow.total = 0;



/// run every tick interval, checks if operator is adjusting throttle
//TEMP!!! the revs are just guesses
engineTick = function () {
};


// Called once each tick.
//
//
hydraulicTick = function () {
    var
        outlet,
        total = 0.0,
        inRes;

    if (inValve.closed()) {
        panelItems.modelFail.pulse();

        // there's no source water, if any outlet is open drop the pressure to 0
    } else {
        inRes = inValve.resistance() + modelComponents.hose.resistance.h65 * 3;
        pres.pumpEye = pres.hydrant - utils.sq(flow.total) * inRes;

        if (pres.pumpEye < -100) {
            panelItems.cavitation.pulse();
        }
        pres.pumpOut = pres.pumpEye + boost(engine.rpm, flow.total);


    }


    total = attackLine.getFlow(pres.pumpOut);

    flow.total = (flow.total + total) / 2;

    if (isNaN(flow.total)) {
        //TEMP!!!
        flow.total = 0;
    }

};



function setOutValve(value) {
    var totalRes;
    outValve.set(value);
    totalRes = outValve.resistance() + 1 / 650;    //TEMP!!! add a length of 38
    attackLine.setHoseResistance(totalRes);
}

function setInValve(value) {
    inValve.set(value);
}


function setThrottle(level) {
    engine.rpm = level * 5000;
    panelItems.modelFail.set(engine.rpm > 4000);
}


function tick() {
    try {

        engineTick();
        hydraulicTick();
    }
    catch (ex) {
        utils.handleException(ex);
    }

}





var updatePanel = function () {
    var i;
    panelItems.outGauge.showPressure(pres.pumpOut);
    panelItems.combGauge.showPressure(pres.pumpEye);
    panelItems.revGauge.showPressure(engine.rpm);
    panelItems.outFlow.set(flow.total);
};


var buildPumpPanel = function (jqSvg, svgDocument) {
    svg.setDocument(svgDocument);
    try {
        var
            de = svgDocument.documentElement,
            heart = utils.timerHeart(10);  // ten times per second

        paintPanel();

        panelItems = attachWidgets(de);

        panelItems.outValve.setCallback(setOutValve);
        panelItems.inValve.setCallback(setInValve);
        panelItems.throttle.setCallback(setThrottle);

        heart.addCallback(tick);
        heart.addCallback(updatePanel);

        heart.start();

        attackLine.waterOn(true);

    }
    catch (ex) {
        utils.handleException(ex);
    }
};






