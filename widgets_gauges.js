/*global widgets svgDocument setAttrs myDebug*/
"use strict";

//var widgets;

if (!widgets) {
	widgets = {};
}

var
	svgns = "http://www.w3.org/2000/svg",
	xlinkNS = "http://www.w3.org/1999/xlink";


widgets.gauges.baseGauge = function (backName, settings) {
	var
		back,
		needle,
		halfWidth = settings.size / 2,
		cx = settings.cx,
		cy = settings.cy;

	back = svgDocument.createElementNS(svgns, "use");
	back.setAttributeNS(xlinkNS, "href", backName);
	setAttrs(back, {x: settings.cx - halfWidth, y: settings.cy - halfWidth, width: settings.size, height: settings.size});
	settings.parent.appendChild(back);

	needle = svgDocument.createElementNS(svgns, "use");
	needle.setAttributeNS(xlinkNS, "href", "#needle");
	setAttrs(needle, {x: settings.cx - halfWidth, y: settings.cy - halfWidth, width: settings.size, height: settings.size});
	settings.parent.appendChild(needle);

	return {
		setNeedle: function (angle) {
			needle.setAttribute("transform", "rotate(" + angle + "," + cx + "," + cy + ")");
		},
		move: function (settings) {
			cx = settings.x + settings.size / 2;
			cy = settings.y + settings.size / 2;
			setAttrs(needle, {x: settings.x, y: settings.y, width: settings.size, height: settings.size});
			setAttrs(back, {x: settings.x, y: settings.y, width: settings.size, height: settings.size});
		}
	};
};


widgets.gauges.highPressure = function (settings) {
	var base = widgets.gauges.baseGauge("#hpGauge", settings);

	return {
		showPressure: function (p) {
			var a;
			if (p < 0) {
				a = -135; // bottom out
			} else if (p > 4000) {
				a = 135;  // 100kPa in 20deg
			} else {
				a = -135 + p / 4000 * 270;
			}
			base.setNeedle(a + 180);

		}
	};
};

widgets.gauges.outlet = function (settings) {
	var base = widgets.gauges.baseGauge("#outletGauge", settings);

	return {
		showPressure: function (p) {
			var a;
			if (p < 0) {
				a = -135; // bottom out
			} else if (p > 2500) {
				a = 135;  // 100kPa in 20deg
			} else {
				a = -135 + p / 2500 * 270;
			}
			base.setNeedle(a + 180);

		}
	};
};

widgets.gauges.engineRevs = function (settings) {
	var base = widgets.gauges.baseGauge("#revsGauge", settings);

	return {
		showPressure: function (rpm) {
			var a;
			if (rpm < 0) {
				a = -135; // bottom out
			} else if (rpm > 5000) {
				a = 135;  // 100kPa in 20deg
			} else {
				a = -135 + rpm / 5000 * 270;
			}
			base.setNeedle(a + 180);

		}
	};
};


widgets.gauges.compound = function (settings) {
	var base = widgets.gauges.baseGauge("#compoundGauge", settings);

	return {
		showPressure: function (p) {
			var a;
			if (p < -100) {
				a = -140;
			} else if (p < 0) {
				a = p * 1.4; // 100kPa in 140deg
			} else if (p < 100) {
				a = p * 0.2;  // 100kPa in 20deg
			} else if (p < 400) {
				a = 20 + (p - 100) * 0.06; // 6deg per 100kPa
			} else if (p < 1600) {
				a = 38 + (p - 400) * 0.08; // 8deg per 100kPa
			} else {
				a = 38 + 1200 * 0.08;
			}
			base.setNeedle(a + 180);

		},

		smash: function () {
		},

		remove: function () {
		},

		setPos: function (parent, x, y) {
		}
	};
};

widgets.gauges.flow = function (settings) {
	var priv = {
		textNode: svgDocument.createTextNode("----"),
		textElem: svgDocument.createElementNS(svgns, "text"),
		mount: svgDocument.createElementNS(svgns, "circle"),
		cx: settings.cx,
		cy: settings.cy,
		width: settings.width
	};
	setAttrs(priv.mount, {
		cx: priv.cx,
		cy: priv.cy,
		r: settings.width / 2,
		fill: "#880000"
	});
	setAttrs(priv.textElem, {
		"text-anchor": "middle",
		x: priv.cx,
		y: priv.cy,
		"font-family": "arial",
		fill: "#FF0000"
	});
	priv.textElem.appendChild(priv.textNode);
	settings.parent.appendChild(priv.mount);
	settings.parent.appendChild(priv.textElem);
	return {
		set: function (flow) {
			if (flow < 0 || flow > 9999) {
				throw {name: 'badParam', message: 'bad flow:' + flow.toString()};
			}
			var text = Math.round(flow).toString();
			while (text.length < 4) {
				text = "0" + text;
			}
			priv.textNode.nodeValue = text;
		}
	};
};




