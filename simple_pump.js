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
}

// Called once each tick.
//
//
hydraulicTick = function () {
    var
        outlet,
        total = 0.0,
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
        total = attackLine.getFlow(pres.pumpOut);

        flow.total = (flow.total + total) / 2;

        if (isNaN(flow.total)) {
            //TEMP!!!
            flow.total = 0;
        }
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
    panelItems.redline.set(engine.rpm > 4000);
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

var hoseResistances = [
    modelComponents.hose.resistance.h65,      // single 65mm
    modelComponents.hose.resistance.h65 / 4,  // twinned 65mm
    modelComponents.hose.resistance.h65 / 8,  // 90mm //TEMP!!! guess
    modelComponents.hose.resistance.h65 / 16   //110mm  //TEMP!!! guess
];

var hoseLayImpact = [
    1,  // straight
    1.1,   // flaked
    1.5    // spaghetti
];

var setHydrantLineResistance = function () {
    var
        menu = panelItems.hydrantMenu,
        lengthRes = hoseResistances[menu.hoseSize.value()],
        adjust = hoseLayImpact[menu.hoseState.value()];
    hydrantLine.resistance = menu.length.value() * lengthRes * adjust;
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

        heart.addCallback(tick);
        heart.addCallback(updatePanel);

        heart.start();

        attackLine.waterOn(true);

    }
    catch (ex) {
        utils.handleException(ex);
    }
};






