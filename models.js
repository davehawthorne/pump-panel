"use strict";


var modelComponents = {
    gaam: {
        mk450: {
            url: "http://www.gaam.com.au/__data/assets/pdf_file/0006/16755/MK450.pdf",
            normalPressureBoost: function (revs, flow) {
                var revRatio = revs / 4000;
                return revRatio * (1000 - flow * 0.2);
            },
            highPressureBoost: function (revs, flow) {
                var revRatio = revs / 4000;
                return revRatio * (2000 - 8e-4 * flow * flow);
            }
        }
    },

    hose: {
        fricLoss: function (resistance, lengths, parallel, flow) {
            return lengths * sq(flow / parallel) * resistance;
        },


        // for 30m of line hose, no restrictions
        // from Australian Fire Authorities Council Pump Operation learning manual
        // kPa/(l/min)^2
        resistance: {
            h38: 1/650,
            h65: 1/8000,
            h90: 1/45000
        }
    },

    // Valves are modelled as variable resistance ranging from zero to infinite.  
    // midWayPresDrop is in kPa
    // forFlow is in l/min
    //
    // Opening is in the range 0.0 (closed) to 1.0 (fully open).
    valve: function (midWayPresDrop, forFlow) {
        var priv = {
            opening: 0.0,
            halfwayResistance: midWayPresDrop / sq(forFlow),
            resistance: function () {
                if (priv.opening == 0.0) {
                    return Number.POSITIVE_INFINITY
                } else {
                    return priv.halfwayResistance * (1.0 / priv.opening - 1.0);
                }
            },
        };
        return {
            resistance: priv.resistance,

            presDrop: function (flow) {
                return priv.resistance() * sq(flow);
            },

            flowRate: function (presIn, presOut) {
                return sqrt((presIn - presOut) / priv.resistance());
            },

            set: function (opening) {
                priv.opening = opening;
            },

            closed: function () {
                return priv.opening == 0.0;
            }
        };
    },


    branch: {
        protek366: function (settings) {
            var priv = {
                minWorkingPres: 700,
                setFlow: 475,
                open: false
            };
            return {
                flow: function (pres) {
                    if (!priv.open) {
                        return 0.0;
                    }
                    //if (pres < 0.0) {
                    //    return 0.0;
                    //} else
                    if (pres < priv.minWorkingPres) {
                        return priv.setFlow * (1.0 - sq(1.0 - pres / priv.minWorkingPres));
                    } else {
                        return priv.setFlow;
                    }
                },
                waterOn: function (on) {
                    priv.open = on;
                }
            };
        }
    }
};

