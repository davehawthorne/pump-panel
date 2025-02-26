/*global widgets model modelComponents utils svg paintPanel attachWidgets */
"use strict";

///
/// Notes:
///   All pressures are relative to atmospheric: 100kPa
///   Pressures given in kPa, flows in l/min





var
    panelItems,
    engine,
    flow = {},
    engineTick,
    boost,
    numAttackLines = 1,
    hydrantLine, attackLine, outValve, inValve, pres, hydraulicTick, iterateFlow,
    params;


boost = modelComponents.gaam.mk450.normalPressureBoost;

outValve = modelComponents.valve(500, 500);
attackLine = modelComponents.attackLine();
inValve = modelComponents.valve(500, 1000); // inlet at halfway 1kL/min flow drops 500kPa through valve

hydrantLine = {
    resistance: 0,
    head: 0
};

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

var zeroPressures = function () {
    pres.pumpEye = 0;
    pres.pumpOut = 0;
    flow.total = 0;
};

// Called once each tick.
//
//
hydraulicTick = function () {
    var
        outlet,
        total = 0.0,
        branchState,
        inRes;

    if (inValve.closed()) {
        if (!outValve.closed()) {
            zeroPressures();
        }

        // there's no source water, if any outlet is open drop the pressure to 0
    } else {
        pres.inlet = pres.hydrant - hydrantLine.head - utils.sq(flow.total) * hydrantLine.resistance;
        pres.pumpEye = pres.inlet - utils.sq(flow.total) * inValve.resistance();
        if (pres.inlet < 0) {
            panelItems.hoseCollapse.pulse();
            zeroPressures();
        }
        if (pres.pumpEye < -100) {
            panelItems.cavitation.pulse();
            zeroPressures();
        }
        pres.pumpOut = pres.pumpEye + boost(engine.rpm, flow.total);

    }

    if (pres.pumpOut) {
        branchState = attackLine.getFlow(pres.pumpOut);
        pres.branch = branchState.presBranch;
        if (branchState.underPressure) {
            panelItems.underPressure.pulse();
        }

        total = branchState.flow * numAttackLines;
        flow.total = (2 * flow.total + total) / 3;

        if (isNaN(flow.total)) {
            //TEMP!!!
            flow.total = 0;
        }
    }

};



function setOutValve(value) {
    var totalRes;
    outValve.set(value);
    attackLine.setValveResistance(outValve.resistance());
}


function setInValve(value) {
    inValve.set(value);
}


function setThrottle(level) {
    engine.rpm = 500 + level * 3500;
    panelItems.redline.set(engine.rpm > 3500);
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
    panelItems.branchGauge.showPressure(pres.branch);
    panelItems.combGauge.showPressure(pres.pumpEye);
    panelItems.revGauge.showPressure(engine.rpm);
    panelItems.outFlow.set(flow.total);
};


var branchChange = function (i) {
    var flows, hoseRes;
    switch (i) {
    case 0:
        flows = [115, 230, 360, 475];
        hoseRes = modelComponents.hose.resistance.h38;
        break;
    case 1:
        flows = [360, 475, 550, 750, 950];
        hoseRes = modelComponents.hose.resistance.h65;
        break;
    default:
        throw 'bad';  //TEMP!!!
    }
    attackLine.setHoseLengthResistance(hoseRes);
    panelItems.attackMenu.nominalFlow.setItems(flows);

};


//var setAttackLine = function () {
//    var
//        menu = panelItems.attackMenu,
//
//    attackLine.setHoseResistance(menu.length * );
//TEMP!!!



var hoseResistances = [
    modelComponents.hose.resistance.h65,      // single 65mm
    modelComponents.hose.resistance.h65 / 4,  // twinned 65mm
    modelComponents.hose.resistance.h90       // single 90mm
];

var hoseLayImpact = [
    1,  // straight
    1.1,   // flaked
    1.5    // spaghetti
];

var setHydrantLineResistance = function () {
    var
        menu = panelItems.hydrantMenu,
        lengthRes = hoseResistances[menu.hoseSize.index()],
        adjust = hoseLayImpact[menu.hoseState.index()];
    hydrantLine.resistance = menu.length.value() * lengthRes * adjust;
};


var derateAttackLine = function (state) {
    attackLine.derateHose(hoseLayImpact[state]);
};



var buildPumpPanel = function () {
    try {
        var
            heart = utils.timerHeart(10);  // ten times per second

        paintPanel();

        panelItems = attachWidgets(null);

        panelItems.outValve.setCallback(setOutValve);
        panelItems.inValve.setCallback(setInValve);
        panelItems.throttle.setCallback(setThrottle);

        panelItems.hydrantMenu.pressure.setCallback(function (val) {
            pres.hydrant = val;
        });

        panelItems.hydrantMenu.rise.setCallback(function (val) {
            hydrantLine.head = val * 10;
        });

        panelItems.hydrantMenu.length.setCallback(setHydrantLineResistance);
        panelItems.hydrantMenu.hoseSize.setCallback(setHydrantLineResistance);
        panelItems.hydrantMenu.hoseState.setCallback(setHydrantLineResistance);

        panelItems.attackMenu.numAttackLines.setCallback(function (val) {
            numAttackLines = val;
        });
        panelItems.attackMenu.nominalFlow.setCallback((i,v) => attackLine.dialUpFlow(v));
        panelItems.attackMenu.length.setCallback(attackLine.setNumHoseLengths);
        panelItems.attackMenu.rise.setCallback(attackLine.setRise);
        panelItems.attackMenu.branchOption.setCallback(branchChange);
        panelItems.attackMenu.hoseState.setCallback(derateAttackLine);

        heart.addCallback(tick);
        heart.addCallback(updatePanel);

        heart.start();

        attackLine.waterOn(true);

    }
    catch (ex) {
        utils.handleException(ex);
    }
};
