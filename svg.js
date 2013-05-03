/*global utils*/
"use strict";

var mySvg = {
	ns: "http://www.w3.org/2000/svg",
	xlinkNs: "http://www.w3.org/1999/xlink",
	setDocument: function (root) {
		mySvg.root = root;
		mySvg.document = root.ownerDocument;
	}
},
svg = mySvg;


mySvg.create = function (type, attributes) {
	var
		element = mySvg.document.createElementNS(mySvg.ns, type),
		attrName,
		parent = attributes.parent || mySvg.root;

	for (attrName in attributes) {
		if (attrName !== 'parent' && typeof attributes[attrName] !== 'function') {
			element.setAttribute(attrName, attributes[attrName]);
		}
	}

	parent.appendChild(element);
	return element;
};


mySvg.radGrad = function (settings) {
	var attrs, grad;
	attrs = utils.copyAttribs(settings, ["id", "fx", "fy", "cx", "cy", "r"]);
	grad = mySvg.create('radialGradient', attrs);
	mySvg.create('stop', {parent: grad, style: 'stop-color:' + settings.c1, offset: 0});
	mySvg.create('stop', {parent: grad, style: 'stop-color:' + settings.c2, offset: 1});
	return grad;
};


mySvg.linGrad = function (settings) {
	var grad = mySvg.create('linearGradient', {
		id: settings.id,
		x1: settings.x1,
		y1: settings.y1,
		x2: settings.x2,
		y2: settings.y2
	});
	mySvg.create('stop', {parent: grad, style: 'stop-color:' + settings.c1, offset: 0});
	mySvg.create('stop', {parent: grad, style: 'stop-color:' + settings.c2, offset: 1});
	return grad;
};


mySvg.rgb2str = function (rgb) {
	return "rgb(" + rgb[0].toString() + ", " + rgb[1].toString() + ", " + rgb[2].toString() + ")";
};



mySvg.createText = function (settings) {
	var text, i, line, span, textArray;
	text = mySvg.create("text", {
		"text-anchor": settings.align || "middle",
		"font-family": "arial",
		"font-size": settings.fontSize || 20,
		y: settings.yTop,
		x: settings.cx,
		fill: settings.color || "white"
	});

	textArray = (typeof settings.text === 'string') ? [settings.text] : settings.text;
	for (i = 0; i < textArray.length; i += 1) {
		line = mySvg.document.createTextNode(textArray[i]);
		span = mySvg.document.createElementNS(mySvg.ns, "tspan");
		span.appendChild(line);
		mySvg.setAttrs(span, {
			dy: i ? "1em" : "0em"
		});
		text.appendChild(span);
	}

	return text;
};


//TEMP!!!
mySvg.setAttrs = function (element, atts) {
	var atName;
	for (atName in atts) {
		if (typeof atts[atName] !== 'function') {
			element.setAttribute(atName, atts[atName]);
		}
	}
};

