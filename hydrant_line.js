"use strict";
/*global utils*/

/// Darcy–Weisbach equation  http://en.wikipedia.org/wiki/Darcy-Weisbach_friction_factor
/*
ΔP = C ⋅ l ⋅ sqr(V)

l is hose length
C is a constant for a given hose diameter and Darcy friction factor, here I'll call it resistance.
V is the flow rate


*/

var modelComponents = window.modelComponents || {};

/// Includes hydrant valve, hose losses, inlet valve loss and plumbing to the
/// pump eye.  Called whenever the configuration or valves are changed.
///
/// We assume the 125mm inlet has twinned lines in and the 65mm inlets have a
/// single line in each.
modelComponents.computeDeliveryLoss = function (hydrantPres, model, inValves) {
    var
        i,
        // friction loss of each line [kPa.(l/m)^-2]
        hoseResist = model.lengthResistance * model.lengths,
        // accumulated figure over all inlet lines
        conductivity = 0.0,
        // the resistance added by the tight plumbing of the 65mm inlets
        plumbResist = model.plumbResistance,
        equivResist,
        firstLineToFail = null,
        minPressureDrop = Number.POSITIVE_INFINITY,
        // given all lines are the same length, what flow results in no pressure
        // at the end of any hose.
        sqrMaxFlowAnyLine = hydrantPres / hoseResist,

        hypertheticalPresDrop;



    // if (!hydrantValve.open()) {
    //
    // }

    // if no inlet valves open, or hydrant valve closed then there's just no flow.

    // Check the two 65mm inlets first; we have to factor in an extra loss due to
    // the tight 90deg bends in the plumbing.
    for (i = 0; i < 3; i += 1) {
        if (!inValves[i].closed()) {
            if (i === 1) {
                // Do the 125mm inlet.  Note that we don't have an extra plumbing loss
                // We twin lines into this inlet so hose resistance factor is one quarter
                equivResist = hoseResist / 4 + inValves[i].resistance();
                hypertheticalPresDrop = 4 * sqrMaxFlowAnyLine * equivResist;
            } else {
                equivResist = hoseResist + inValves[i].resistance() + plumbResist;
                hypertheticalPresDrop = sqrMaxFlowAnyLine * equivResist;
            }
            if (hypertheticalPresDrop < minPressureDrop) {
                minPressureDrop = hypertheticalPresDrop;
                firstLineToFail = i;
            }
            conductivity += 1 / utils.sqrt(equivResist);
        }
    }

    if (conductivity === 0.0) {
        // no inlet valve is open
        return {
            open: false,
            maxFlow: 0.0,
            equivResist: Number.POSITIVE_INFINITY
        };

    } else {
        equivResist = 1 / utils.sq(conductivity);
        return {
            open: true,
            maxFlow: utils.sqrt(minPressureDrop / equivResist),

            // this figure is the combined resistance of all the lines ganged together
            equivResist: equivResist
        };
    }

};



