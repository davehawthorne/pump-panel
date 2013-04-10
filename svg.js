/*global utils*/
"use strict";

var svgDocument;  //TEMP!!!

var svg = {
	ns: "http://www.w3.org/2000/svg",
	xlinkNs: "http://www.w3.org/1999/xlink",
	setDocument: function (evt) {
		if (!window.svgDocument) {
			svg.document = evt.target.ownerDocument;
		}
	}
};


svg.create = function (type, attributes) {
	var
		element = svg.document.createElementNS(svg.ns, type),
		attrName,
		parent = attributes.parent || svg.document.documentElement;

	for (attrName in attributes) {
		if (attrName !== 'parent' && typeof attributes[attrName] !== 'function') {
			element.setAttribute(attrName, attributes[attrName]);
		}
	}

	parent.appendChild(element);
	return element;
};


svg.radGrad = function (settings) {
	var attrs, grad;
	attrs = utils.copyAttribs(settings, ["id", "fx", "fy", "cx", "cy", "r"]);
	grad = svg.create('radialGradient', attrs);
	svg.create('stop', {parent: grad, style: 'stop-color:' + settings.c1, offset: 0});
	svg.create('stop', {parent: grad, style: 'stop-color:' + settings.c2, offset: 1});
	return grad;
};


svg.linGrad = function (settings) {
	var grad = svg.create('linearGradient', {
		id: settings.id,
		x1: settings.x1,
		y1: settings.y1,
		x2: settings.x2,
		y2: settings.y2
	});
	svg.create('stop', {parent: grad, style: 'stop-color:' + settings.c1, offset: 0});
	svg.create('stop', {parent: grad, style: 'stop-color:' + settings.c2, offset: 1});
	return grad;
};


svg.rgb2str = function (rgb) {
	return "rgb(" + rgb[0].toString() + ", " + rgb[1].toString() + ", " + rgb[2].toString() + ")";
};



svg.createText = function (settings) {
	var text, i, line, span, textArray;
	text = svg.create("text", {
		"text-anchor": "middle",
		"font-family": "arial",
		fill: "white",
		x: settings.cx,
		y: settings.yTop
	});

	textArray = (typeof settings.text === 'string') ? [settings.text] : settings.text;
	for (i = 0; i < textArray.length; i += 1) {
		line = svg.document.createTextNode(textArray[i]);
		span = svg.document.createElementNS(svg.ns, "tspan");
		span.appendChild(line);
		svg.setAttrs(span, {
			x: settings.cx,
			dy: i ? "1em" : "0em"
		});
		text.appendChild(span);
	}

	return text;
};


//TEMP!!!
svg.setAttrs = function (element, atts) {
	var atName;
	for (atName in atts) {
		if (typeof atts[atName] !== 'function') {
			element.setAttribute(atName, atts[atName]);
		}
	}
};

