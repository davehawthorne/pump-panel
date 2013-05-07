"use strict";
/*global modelComponents*/

modelComponents.tank = function (settings) {
	var priv = {
		cap: settings.cap,
		water: settings.cap,  // start with a full tank
		presFactor: settings.height / settings.cap,
		alarmLevel: settings.alarmLevel,
		lowWaterCallback: settings.lowWaterCallback,
		noWaterCallback: settings.noWaterCallback,
		overflowCallback: settings.overflowCallback
	};
	return {
		pressure: function () {
			// full tank of 2000l gives 10kPa
			return priv.water * priv.presFactor;
		},
		draw: function (amount) {
			if (amount < 0) {
				throw {name: 'badParam', message: 'neg draw:' + amount.toString()};
			}
			priv.water -= amount;
			if (priv.water < 0.0) {
				priv.water = 0.0;
				if (priv.noWaterCallback) {
					priv.noWaterCallback();
				}
			}
			if (priv.water < priv.alarmLevel && priv.lowWaterCallback) {
				priv.lowWaterCallback();
			}
		},
		fill: function (amount) {
			if (amount < 0) {
				throw {name: 'badParam', message: 'neg fill:' + amount.toString()};
			}
			priv.water += amount;
			if (priv.water > priv.cap) {
				if (priv.overflowCallback) {
					priv.overflowCallback(priv.water - priv.cap);
				}
				priv.water = priv.cap;
			}
		},
		getWater: function() {
			return priv.water;
		},
		getLevel: function () {
			return priv.water / priv.cap;
		}
	};
};

