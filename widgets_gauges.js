/*global widgets svgDocument setAttrs myDebug*/
"use strict";

//var widgets;

if (!widgets) {
	widgets = {};
}

if (!widgets.gauges) {
	widgets.gauges = {};
}

var
	//TEMP!!! lose these
	svgns = "http://www.w3.org/2000/svg",
	xlinkNS = "http://www.w3.org/1999/xlink";

/// used to generate the graduations on a gauge dial, these are built as just
/// three paths, each of a different thickness.
widgets.dialGraduations = function(cx, cy, r) {
	var
		thinLine = '',
		midLine = '',
		thickLine = '',
		lineCoords = function(angle, r1, r2) {
			var
				trim = function(x) { return Math.round(1000 * x)/1000;},
				theta = (angle + 90) * Math.PI / 180,
				x = Math.cos(theta),
				y = Math.sin(theta),
				x1 = trim(cx + r1 * x),
				y1 = trim(cy + r1 * y),
				x2 = trim(cx + r2 * x),
				y2 = trim(cy + r2 * y);

			return 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + ' ';
		};

	return {
		minor: function(angle) {
			thinLine += lineCoords(angle, r * 0.85, r * 0.75);
		},

		mid: function(angle) {
			thinLine += lineCoords(angle, r * 0.85, r * 0.70);
		},

		major: function(angle) {
			thinLine += lineCoords(angle, r * 0.85, r * 0.75);
			midLine += lineCoords(angle, r * 0.75, r * 0.65);
		},

		zero: function(angle) {
			thinLine += lineCoords(angle, r * 0.85, r * 0.75);
			thickLine += lineCoords(angle, r * 0.75, r * 0.70);
			midLine += lineCoords(angle, r * 0.70, r * 0.65);
		},

		draw: function(svg, color) {
			return [
				svg.create("path", {stroke: color, "stroke-width": 1, d: thinLine}),
				svg.create("path", {stroke: color, "stroke-width": 2, d: midLine}),
				svg.create("path", {stroke: color, "stroke-width": 4, d: thickLine})
			];
		}
	}
}


widgets.placeText = function(settings, textArray) {
	var
		i,
		t,
		halfWidth = settings.size / 2;

	for (i = 0; i < textArray.length; i++) {
		t = textArray[i];
		svg.createText(
			{
				color: 'black',
				align: 'left',
				fontSize: 12,
				text: t[2],
				yTop: settings.cy + t[1] * halfWidth,
				cx: settings.cx + t[0] * halfWidth
			}
		);
	}
}


/// Creates the bevel, face and needle for a gauge.
/// Private method
///
widgets.gauges.baseGauge = function (backName, settings) {
	var
		back,
		needle,
		halfWidth = settings.size / 2,
		cx = settings.cx,
		cy = settings.cy,
		priv;

	priv = {};

	if (!widgets.gauges.common) {
		widgets.gauges.common = [
			svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'white', c2: 'grey', id: "convexGaugeBevelFill"}),
			svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'grey', c2: 'white', id: "concaveGaugeBevelFill"})
		];

		needle = svg.create("symbol",
			{
				id: "needle",
				width: 20,
				height: 20,
				style: "fill:black",
				viewBox: "-10 -10 20 20"
			}
		);

		svg.create("circle", {parent: needle, r: 1});
		svg.create("polyline", {parent: needle, points: "-0.3,0 0,8.5 0.3,0 1,-3 -1,-3 -0.3,0", style: "fill:black"});
		svg.create("circle", {parent: needle, r: 0.2, style: "fill:white"});

	}

	priv.convexBevel = svg.create("circle", {
		cx: cx,
		cy: cy,
		r: halfWidth,
		stroke: "black",
		fill: "url(#convexGaugeBevelFill)"
	});

	priv.concaveBevel = svg.create("circle", {
		//parent: priv.convexBevel,
		cx: cx,
		cy: cy,
		r: halfWidth * 0.95,
		stroke: "none",
		fill: "url(#concaveGaugeBevelFill)"
	});

	priv.face = svg.create("circle", {
		cx: cx,
		cy: cy,
		r: halfWidth * 0.9,
		stroke: "black",
		fill: "white"
	});

	needle = svg.document.createElementNS(svgns, "use");
	needle.setAttributeNS(xlinkNS, "href", "#needle");
	setAttrs(needle, {x: settings.cx - halfWidth, y: settings.cy - halfWidth, width: settings.size, height: settings.size});
	if (!settings.parent) {
		settings.parent = svg.root;
	}
	settings.parent.appendChild(needle);

	return {
		setNeedle: function (angle) {
			needle.setAttribute("transform", "rotate(" + angle + "," + cx + "," + cy + ")");
		},
		move: function (settings) {
			cx = settings.x + settings.size / 2;
			cy = settings.y + settings.size / 2;
			setAttrs(needle, {x: settings.x, y: settings.y, width: settings.size, height: settings.size});
			setAttrs(back, {x: settings.x, y: settings.y, width: settings.size, height: settings.size});  //TEMP!!! fix
		}
	};
};


/// Creates a high pressure outlet gauge: 0 to 4000kPa
widgets.gauges.highPressure = function (settings) {
	var
		base = widgets.gauges.baseGauge("#hpGauge", settings),
		a, i,
		halfWidth = settings.size / 2,
		grad = widgets.dialGraduations(settings.cx, settings.cy, halfWidth);

	grad.zero(45);
	for (a = 45 + 6.75, i = 1; a <= 315; a += 6.75)
	{
		switch (i) {
		case 5:
			grad.mid(a);
			break;
		case 10:
			grad.major(a);
			i = 0;
		default:
			grad.minor(a);
		}
		i += 1;

	}
	grad.draw(svg, "black");

	widgets.placeText(
		settings,
		[
			[-0.5, 0.5, '0'],
			[-0.65, -0.1, '1000'],
			[-0.15, -0.55, '2000'],
			[0.35, -0.1, '3000'],
			[0.15, 0.5, '4000']
		]
	);

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


/// Creates a normal outlet gauge: 0 to 2500kPa
widgets.gauges.outlet = function (settings) {
	var
		base = widgets.gauges.baseGauge("#outletGauge", settings),
		a, i,
		r2,
		halfWidth = settings.size / 2,
		grad = widgets.dialGraduations(settings.cx, settings.cy, halfWidth);


	grad.zero(45);
	for (a = 45 + 5.4, i = 1; a <= 315; a += 5.4)
	{

		if (i==10) {
			grad.major(a);
			i = 0;
		} else if (i & 1) {
			grad.minor(a);
		} else {
			grad.mid(a);
		}

		i += 1;

	}
	grad.draw(svg, 'black');

	widgets.placeText(
		settings,
		[
			[-0.5, 0.5, '0'],
			[-0.65, -0.1, '500'],
			[-0.4, -0.5, '1000'],
			[0.1, -0.5, '1500'],
			[0.35, -0.1, '2000'],
			[0.15, 0.5, '2500']
		]
	);

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
	var
		base = widgets.gauges.baseGauge("#revsGauge", settings),
		a, i,
		halfWidth = settings.size / 2,
		grad = widgets.dialGraduations(settings.cx, settings.cy, halfWidth);

	grad.zero(45);
	for (a = 45 + 5.4, i = 1; a <= 315; a += 5.4)
	{

		if (i == 10) {
			grad.major(a);
			i = 0;
		} else if (i == 5) {
			grad.mid(a);
		} else {
			grad.minor(a);
		}

		i += 1;

	}
	grad.draw(svg, 'black');

	widgets.placeText(
		settings,
		[
			[-0.5, 0.5, '0'],
			[-0.65, -0.1, '500'],
			[-0.4, -0.5, '1000'],
			[0.1, -0.5, '1500'],
			[0.35, -0.1, '2000'],
			[0.15, 0.5, '2500']
		]
	);

	return {
		showPressure: function (rpm) {
			var a;
			if (rpm < 0) {
				a = -135; // bottom out
			} else if (rpm > 5000) {
				a = 135;  // 100rpm in 20deg
			} else {
				a = -135 + rpm / 5000 * 270;
			}
			base.setNeedle(a + 180);

		}
	};
};


/// Creates an inlet gauge -100 to 1600kPa
widgets.gauges.compound = function (settings) {
	var
		base = widgets.gauges.baseGauge("#compoundGauge", settings),
		a, i,
		r2,
		halfWidth = settings.size / 2,
		redGrad = widgets.dialGraduations(settings.cx, settings.cy, halfWidth),
		blackGrad = widgets.dialGraduations(settings.cx, settings.cy, halfWidth);

	for (a = 180 - 7, i = 1; a >= 40; a -= 7) {
		switch (i) {
		case 0:
			redGrad.major(a);
			i++;
			break;
		case 1:
			redGrad.minor(a);
			i++;
			break;
		case 2:
			redGrad.mid(a);
			i++;
		default:
			redGrad.minor(a);
			i = 0;
		}
	}

	blackGrad.zero(180);


	blackGrad.major(200);
	blackGrad.minor(206);
	blackGrad.minor(212);
	for (a = 218, i = 0; a <= 315; a += 8) {
		if (i == 0) {
			blackGrad.major(a);
		} else {
			blackGrad.minor(a);
		}
		i = (i + 1) & 3;
	}

	redGrad.draw(svg,'red');
	blackGrad.draw(svg,'black');



	widgets.placeText(
		settings,
		[
			[-0.3, -0.5, "-20"],
			[-0.6, -0.25, "-40"],
			[-0.7, 0, "-60"],
			[-0.6, 0.25, "-80"],
			[-0.5, 0.5, "-100"],
			[-0.05, -0.55, "0"],
			[0.05, -0.5, "100"],
			[0.2, -0.4, "400"],
			[0.4, -0.15, "800"],
			[0.3, 0.15, "1200"],
			[0.2, 0.45, "1600"],
		]
	);

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


// A digital flow gauge: 0 to 9999lpm
widgets.gauges.flow = function (settings) {
	var priv = {
		textNode: svg.document.createTextNode("----"),
		textElem: svg.document.createElementNS(svgns, "text"),
		mount: svg.document.createElementNS(svgns, "circle"),
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
	if (!settings.parent) {
		settings.parent = svg.root;
	}
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




