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
		fricLoss: function (lossFactor, lengths, parallel, flow) {
			return lengths * Math.pow(flow / parallel, 2) / lossFactor;
		},


		// for 30m of line hose, no restrictions
		// from Australian Fire Authorities Council Pump Operation learning manual
		//TEMP!!! 38mm values seem a bit harsh
		//TEMP!!! rename to inverse
		lossFactor: {
			h38: 650,     //TEMP!!!
			//TEMP!!!h38: 1500,  //TEMP!!! my guess
			h65: 8000,
			h90: 45000
		}
	},

	valve: function (halfwayLossFactor) {
		var priv = {
			opening: 0.0,
			lossFactor: function () {
				return halfwayLossFactor * (1.0 / (1.00001 - priv.opening) - 1.0);
			}
		};
		return {
			presDrop: function (flow) {
				return Math.pow(flow, 2) / priv.lossFactor();
			},
			flowRate: function (presIn, presOut) {
				return Math.pow((presIn - presOut) * priv.lossFactor(), 0.5);
			},
			set: function (opening) {
				priv.opening = opening;
			},
			closed: function () {
				return priv.opening === 0.0;
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
						return priv.setFlow * (1.0 - Math.pow(1.0 - pres / priv.minWorkingPres, 2));
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

