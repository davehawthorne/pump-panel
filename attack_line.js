/*global utils*/
"use strict";

var modelComponents = window.modelComponents || {};


/// I have combined the branch and the hose running to it so that we can
/// directly compute branch flow for a given outlet pressure.  The alternative
/// required messy iterations.  The model takes into account the height of the
/// branch relative to the outlet.
///
/// The branch model is pretty crude: flow increases linearly with pressure up
/// to the operating pressure where the flow plateaus.
///
/// Checks for negative flows due to big height differences and blocks them.
///
///
/// Hose resistance is in [kPa.(l/m)^-2]
///
///
///
///
///
///
modelComponents.attackLine = function () {
    var
        workingPres = 700, // [kPa]
        headLoss = 0,  // level ground
        ratedFlow = 475, // [l/min]
        kBranch = ratedFlow / workingPres,
        hoseResistance = 0,
        branchOpen = false;

    return {
        state: function () {
            return {
                workingPres: workingPres,
                headLoss: headLoss,
                ratedFlow: ratedFlow,
                kBranch: kBranch,
                hoseResistance: hoseResistance
            };
        },


        setHoseResistance: function (res) {
            hoseResistance = res;
        },
        setWorkingPres: function (pres) {
            workingPres = pres;
        },
        setRise: function (rise) {
            headLoss = rise * 10;  // kPa/m
        },
        dialUpFlow: function (flow) {
            ratedFlow = flow;
            kBranch = ratedFlow / workingPres;
        },

        waterOn: function (on) {
            branchOpen = on;
        },

        /// presIn is the pressure at the start of the hose [kPa]
        ///
        /// Returns the flow in [l/min]
        getFlow: function (presIn) {
            var flow, discriminant;
            if (!branchOpen) {
                return 0.0;
            }
            if (hoseResistance === 0.0) {
                flow = kBranch * (presIn - headLoss);
            } else {
                discriminant = 1 + 4 * hoseResistance * kBranch * kBranch * (presIn - headLoss);
                flow = (utils.sqrt(discriminant) - 1) / (2 * hoseResistance * kBranch);
            }
            if (flow < 0.0) {
                // no sucking
                flow = 0.0;
            }
            if (flow > ratedFlow) {
                // the branch is operating at right flow
                flow = ratedFlow;
            }
            return flow;
        },


        getBranchPres: function (flow, presIn) {
            var pres = presIn - headLoss - hoseResistance * flow * flow;
            if (pres < 0.0) {
                // no sucking
                pres = 0.0;
            }
            return pres;
        }

    };
};
