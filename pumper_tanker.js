/*global widgets model modelComponents utils svg*/
"use strict";
var widgets;

if (!widgets) {
	widgets = {};
}
///
/// Notes:
///   All pressures are relative to atmospheric: 100kPa

var showWarning = function (text) {

};
/*
dialogBox([
	[
		"Reticulated Pressure [kPa]", 100, 1500
	],
	[
		"Mains Diameter", 100, 1000
	],
	[
		"Height Above Pump [m]", -20, 20
	],
]);


dialogBox([
		"Outlet Pressure [kPa]", 100, 1500
		"Height Above Pump [m]", -20, 20
]);


dialogBox([
		"Flow [lpm]", 115, 230, 360, 475
]);

dialogBox([
		"Tip Diameter [mm]", 12, 15
		"Height Above Pump [m]", -20, 20
]);

*/

var setAttrs = function (element, atts) {
	var atName;
	for (atName in atts) {
		if (typeof atts[atName] !== 'function') {
			element.setAttribute(atName, atts[atName]);
		}
	}
};

/*
Function.method('setAttrs', function () {
	var that = this;
	return function (atts) {
		var atName;
		for (atName in atts) {
			if (typeof atts[atName] !== 'function') {
				that.setAttribute(atName, atts[atName]);
			}
		}
	};
});
*/

var handleException = function (ex) {
	var
		msg = "",
		i;
	for (i in ex) {
		if (typeof ex[i] !== 'function') {
			msg += i + ":" + ex[i] + "\n";
		}
	}
	alert(msg);
};


var svgDocument;

var svgns = "http://www.w3.org/2000/svg";
var xlinkNS = "http://www.w3.org/1999/xlink";

var active = {};  //TEMP!!!

var tempUp = 0;

var debugDisp = function (x, y, text) {
	var
		priv = {
			line: svg.document.createTextNode(text),
			baseText: text
		},
		textWid = svg.document.createElementNS(svgns, "text");
	setAttrs(textWid, {
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
var periodic = function (evt, active) {
	var
		throttle = 0,
		rpm = 0;

	if (throttle === 0) {
		if (active.offOn.isOn()) {
			throttle = 800;
		}
	} else {
		if (active.

};
*/

/*
/// Includes hydrant valve, hose losses, inlet valve loss and plumbing to the
/// pump eye.
var computeDeliveryLoss = function() {
	var
		i,
		hoseResist = 10,   //TEMP!!!  // friction loss factor of a single line
		conductivity = 0.0,
		equivResist;

	if (!hydrantValve.open()) {

	}
	// if no inlet valves open, or hydrant valve closed then there's just no flow.

	// Check the two 65mm inlets first; we have to factor in an extra loss due to
	// the tight 90deg bends in the plumbing.
	for (i = 0; i < 2; i++) {
		if (inletValve[i].open()) {
			conductivity += Math.pow(hoseResist + inletValve[i].resist() + plumbResist, -0.5);
		}
	}
	// Now do the 125mm inlet.  Note that we don't have an extra plumbing loss
	if (inletValve[2].open()) {
		// We twin lines into this inlet so hose resistance factor is one quarter
		conductivity += Math.pow(hoseResist/4 + inletValve[i].resist(), -0.5);
	}

	if (conductivity > 0.0) {
		equivResist = Math.pow(conductivity, -2.0);
	}

	// add in
}
*/

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

/// Converge on a flow value through outlet valve, hose and branch
/// Assumes the pump pressure is fixed.
var calcOutFlow = function (presIn, branch, hosePresDrop, valvePresDrop) {
	var
		flow,
		pres,
		presUp = presIn,
		presLo = 0,
		presTry,
		count;

	for (count = 0; count < 10; count += 1) {
		presTry = (presUp + presLo) / 2;
		flow = branch.flow(presTry);
		pres = presIn - valvePresDrop(flow) - hosePresDrop(flow);
		if (pres < presTry) {
			presUp = presTry;
		} else {
			presLo = presTry;
		}
	}
	return flow;
};




var model = (function () {
	var i, engine, flow, engineTick, attackLineFricLoss, supplyLineFricLoss, boost, branch, outValve, inValve, pres, hydraulicTick, iterateFlow, tank, tankOutOpen;

	attackLineFricLoss = [
		modelComponents.hose.fricLoss.curry(modelComponents.hose.lossFactor.h38, 1, 1),
		modelComponents.hose.fricLoss.curry(modelComponents.hose.lossFactor.h38, 2, 1),
		modelComponents.hose.fricLoss.curry(modelComponents.hose.lossFactor.h38, 3, 1),
		modelComponents.hose.fricLoss.curry(modelComponents.hose.lossFactor.h65, 3, 1)
	];

	supplyLineFricLoss = modelComponents.hose.fricLoss.curry(modelComponents.hose.lossFactor.h65, 1, 2);

	boost = modelComponents.gaam.mk450.normalPressureBoost;
	branch = [
		modelComponents.branch.protek366(),
		modelComponents.branch.protek366(),
		modelComponents.branch.protek366(),
		modelComponents.branch.protek366()
	];

	outValve = [];
	for (i = 0; i < 5; i += 1) {
		outValve[i] = modelComponents.valve(50);
	}

	inValve = [];
	for (i = 0; i < 2; i += 1) {
		inValve[i] = modelComponents.valve(50);
	}

	tank = modelComponents.tank({
		cap: 2000,
		height: 1,
		alarmLevel: 500
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

	tankOutOpen = true;

	engineTick = function () {
		if (engine.state === "running") {
			switch (engine.revInc) {
			case 1:
				engine.rpm += 50;
				if (engine.rpm > 4000) {
					//TEMP!!!
				}
				break;
			case -1:
				engine.rpm -= 50;
				if (engine.rpm < 700) {
					engine.state = "ready";
					engine.rpm = 0;
					//TEMP!!! showWarning("Engine stalled");
				}
				break;
			}
				//TEMP!!! active.revGauge.showPressure(state.engineRpm);
		}
	};

	hydraulicTick = function () {
		var outlet, total = 0.0, fromTank = false;
		if (inValve[0].closed() && inValve[1].closed()) {
			if (tankOutOpen) {
				fromTank = true;
				// flow just from tank
				pres.pumpEye = tank.pressure();
			} else {
				for (outlet = 0; outlet < 5; outlet += 1) {
					flow.outlet[outlet] = 0.0;
				}
				flow.total = 0.0;
				pres.pumpOut = 0.0;
				pres.pumpEye = 0.0;
				pres.pumpHp = 0.0;
				// no flow
			}
		} else {
			// hydrant flow
			do {
				pres.pumpEye = pres.hydrant - supplyLineFricLoss(flow.total) - inValve[0].presDrop(flow.total);
				if (pres.pumpEye < 0) {
					flow.total = flow.total * 0.95;
					$('#ticks').html("collapse");            //TEMP!!!
				}
			} while (pres.pumpEye < 0);
				// hydrant line collapsed

		}
		pres.pumpOut = pres.pumpEye + boost(engine.rpm, flow.total);
		for (outlet = 0; outlet < 5; outlet += 1) {
			if (outValve[outlet].closed()) {
				flow.outlet[outlet] = 0.0;
			} else {
				if (outlet < 4) {
					flow.outlet[outlet] = calcOutFlow(pres.pumpOut, branch[outlet], attackLineFricLoss[outlet], outValve[outlet].presDrop);
				} else {
					flow.outlet[outlet] = outValve[outlet].flowRate(pres.pumpOut, 10);  //TEMP!!!
					tank.fill(flow.outlet[outlet] / 600);
				}
			}
			total += flow.outlet[outlet];
		}
		flow.total = (flow.total + total) / 2;
		if (fromTank) {
			tank.draw(flow.total / 600);
		}

	};

	iterateFlow = function (flow) {
		var
			presBranch,
			branchFlow = [],
			totalFlow = 0,
			outlet;
			//TEMP!!!pos = active.vRightBack.getPosition(),




		debug.of.set(flow);
		debug.pp.set(pres.pumpOut);
		debug.ep.set(pres.pumpEye);
		//debug.op.set(presOutlet);
		//debug.bp.set(presBranch);
		$('#tankLevel').html(branchFlow[0]);
		debug.bf0.set(branchFlow[0]);
		debug.bf1.set(branchFlow[1]);
		debug.bf2.set(branchFlow[2]);
		debug.bf3.set(branchFlow[3]);
		//    branchFlow[o] = branchFlow(presBranch);
		//    totalFlow += branchFlow[o];
		//}
		return totalFlow;
	};

	return {
		setHydrantLengths: function(l) {
			supplyLineFricLoss = modelComponents.hose.fricLoss.curry(modelComponents.hose.lossFactor.h65, l, 1);
		},
		setHydrantPres: function(p) {   //TEMP!!!
			pres.hydrant = p;
		},
		setHydrantLineRise: function(h) {
		},
		setOutValve: function (index, value) {
			outValve[index].set(value);
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
				//TEMP!!!active.revGauge.showPressure(state.engineRpm);
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
			$('#tankLevel').html(tank.getWater());
			$('#totalFlow').html(flow.total);
			$('#pumpPresOut').html(pres.pumpOut);
			$('#pumpPresEye').html(pres.pumpEye);
			}
			catch (ex) {
			   handleException(ex);
			}

		},

		waterOn: function (index, on) {
			branch[index].waterOn(on);
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



var state;  //TEMP!!!




/*
var getNewFlow = function (oldFlow) {
	var		lastDiff = Infinity,
		newFlow,
		diff,
		cycles = 0;

	do {
		cycles += 1;
		newFlow = iterateFlow(oldFlow);
		diff = Math.abs(newFlow - oldFlow);
		if (diff > lastDiff) {
			throw "not converging";
		}
		lastDiff = diff;
	} while (false && diff > 10 && cycles < 10);
	//TEMP!!!	debug.cycles.set(cycles);
	return newFlow * 0.5 + oldFlow * 0.5;
};
*/





/*
var tick = function (active) {
	var presEye, presOutlet;
	if (state.state === "running") {
		if (active.increaseRevs.wasPressed()) {
			state.engineRpm += 100;
			active.revGauge.showPressure(state.engineRpm);
		} else if (active.decreaseRevs.wasPressed()) {
			state.engineRpm -= 100;
			if (state.engineRpm < 700) {
				showWarning("Engine stalled");
				state.state = "ready";
				state.engineRpm = 0;
			}
			active.revGauge.showPressure(state.engineRpm);
		}
	}
	state.flow = getNewFlow(state.flow);

	presEye = presHydrant - supplyLineFricLoss(state.flow);
	presOutlet = presEye + boost(state.engineRpm, state.flow);

	active.combGauge.showPressure(presEye);
	active.outGauge.showPressure(presOutlet);
	//TEMP!!!active.fmRightBack.set(state.flow);

};
*/

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
	// if (!window.svgDocument) {
	// 	svgDocument = evt.target.ownerDocument;
	// }
	try {
		var
			de = svgDocument.documentElement,
			panel = svg.create("rect", {x: 0, y: 0, width: 1500, height: 800, fill: "#202020"}),
			hpCircle = svg.create("circle", {cx: 350, cy: 180, r: 90, fill: "blue"}),
			combCircle = svg.create("circle", {cx: 600, cy: 180, r: 90, fill: "green"}),
			outCircle = svg.create("circle", {cx: 850, cy: 180, r: 90, fill: "red"}),
			//TEMP!!!active,
			i,
			x,
			sideways,
			heart = timerHeart(10);  // ten times per second

		active = {
			outGauge: widgets.gauges.outlet({parent: de, cx: 350, cy: 180, size: 150}),
			combGauge: widgets.gauges.compound({parent: de, cx: 600, cy: 180, size: 150}),
			hpGauge: widgets.gauges.highPressure({parent: de, cx: 850, cy: 180, size: 150}),
			revGauge: widgets.gauges.engineRevs({parent: de, cx: 1025, cy: 180, size: 100}),
			startBut: widgets.controls.pushButton({parent: de, cx: 550, cy: 450, width: 40, text: ["START"], callback: model.startBut}),
			onOff: widgets.controls.toggleSwitch({parent: de, cx: 625, cy: 450, width: 20, text: ["OFF-ON"], callback: model.onOff}),
			decreaseRevs: widgets.controls.pushButton({parent: de, cx: 700, cy: 450, width: 40, text: ["DEC."], callback: model.revDown}),
			increaseRevs: widgets.controls.pushButton({parent: de, cx: 775, cy: 450, width: 40, text: ["INC."], callback: model.revUp}),
			//inLeft: widgets.controls.outletValve({parent: de, cx: 400, yTop: 650, yBot: 750, width: 40}),
			//inRight: widgets.controls.outletValve({parent: de, cx: 950, yTop: 650, yBot: 750, width: 40}),
			tankIso: widgets.controls.toggleSwitch({parent: de, cx: 1150, cy: 180, width: 20, text: ["WATER TANK", "ISO VALVE"], callback: model.tankIso}),
			waterLevel: widgets.gauges.levelIndicator({cx: 1300, yTop: 50, lampDist: 50, title: "WATER"})
		};

		active.waterLevel.set(0.5);
		//active.revGauge.showPressure(0);
		//active.fmRightBack.set(0);
		active.outValue = [];
		active.outFlow = [];
		for (i = 0; i < 5; i += 1) {
			x = (i < 2) ? (300 + i * 200) : (450 + i * 200);
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
		for (i = 0; i < 2; i += 1) {
			x = 400 + i * 550;
			sideways = -15 + i * 30;
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

		debug.felt = svg.create("rect", {parent: de, x: 1500, y: 0, width: 400, height: 800, fill: "green"});
		panel.addEventListener("mouseout", function (evt) {
			tempUp += 1;
			debug.bu.set(tempUp);
		}, false);

		debug.bu = debugDisp(1800, 75, "but up");
		debug.val1 = debugDisp(1800, 100, "knobTopY");
		debug.val2 = debugDisp(1800, 125, "evt.y");
		debug.val3 = debugDisp(1800, 150, "priv.cursorToCentre");

		debug.of = debugDisp(1600, 75, "old flow");
		debug.ep = debugDisp(1600, 100, "eye pres");
		debug.pp = debugDisp(1600, 125, "pump pres");
		debug.op = debugDisp(1600, 150, "out pres");
		//debug.cycles = debugDisp(1600, 150, "cycles");
		debug.bp = debugDisp(1600, 175, "branch pres");
		debug.bf0 = debugDisp(1600, 200, "branch flow 0");
		debug.bf1 = debugDisp(1600, 220, "branch flow 1");
		debug.bf2 = debugDisp(1600, 240, "branch flow 2");
		debug.bf3 = debugDisp(1600, 260, "branch flow 3");
		debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 350, width: 20, text: ["BRANCH0"], callback: model.waterOn.curry(0)});
		debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 400, width: 20, text: ["BRANCH1"], callback: model.waterOn.curry(1)});
		debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 450, width: 20, text: ["BRANCH2"], callback: model.waterOn.curry(2)});
		debug.branch = widgets.controls.toggleSwitch({cx: 1600, cy: 500, width: 20, text: ["BRANCH3"], callback: model.waterOn.curry(3)});

		debug.timerInt = timerInterface(jqSvg, 1600, 30, 50, heart);
		jqSvg.text(1510, 120, "hydrant line lengths");
		debug.hydrantLineLength = numSpinner(jqSvg, 1700, 100, 100, 30, 1, 15, 1, 1, function(x){model.setHydrantLengths(x);});
		jqSvg.text(1510, 155, "hydrant pressure [kPa]");
		debug.hydrantPressure = numSpinner(jqSvg, 1700, 135, 100, 30, 100, 1200, 100, 500, function(x){model.setHydrantPres(x);});
		jqSvg.text(1510, 190, "hydrant line rise [m]");
		debug.hydrantLineRise = numSpinner(jqSvg, 1700, 170, 100, 30, -10, 10, 1, 0, function(x){model.setHydrantLineRise(x);});

		// debug.step = widgets.controls.toggleSwitch({cx: 1600, cy: 600, width: 20, text: ["STEP"]});
		// widgets.controls.pushButton({cx: 1600, cy: 650, width: 40, text: ["STEP"], callback: function () {
		// 	model.tick();
		// 	updatePanel();
		// }});
		//
		//
		// setInterval(function () {
		// 	if (!debug.step.isOn()) {
		// 		return;  //TEMP!!!
		// 	}
		// 	model.tick();
		// 	updatePanel();
		//
		// }, 100);

		model.tick();
		updatePanel();

	}
	catch (ex) {
		handleException(ex);
	}
};


function myDebug(mess) {
}




