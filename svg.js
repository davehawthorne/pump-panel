/*global utils*/
"use strict";

var mySvg = {
    ns: "http://www.w3.org/2000/svg",
    setRoot: function (root) {
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


mySvg.makeThing = function (type, names, args) {
    var
        element = mySvg.document.createElementNS(mySvg.ns, type),
        parent = args[0],
        i,
        name,
        attributes = args[names.length + 1];

    for (i = 0; i < names.length; i++) {
        name = names[i];
        element.setAttribute(name, args[i + 1]);
    }
    if (attributes) {
        for (name in attributes) {
            if (typeof attributes[name] !== 'function') {
                element.setAttribute(name, attributes[name]);
            }
        }
    }
    parent.appendChild(element);
    return element;
};


mySvg.circle = function () {
    return mySvg.makeThing('circle', ['cx', 'cy', 'r'], arguments);
};


mySvg.rect = function () {
    return mySvg.makeThing('rect', ['x', 'y', 'width', 'height'], arguments);
};


mySvg.group = function () {
    return mySvg.makeThing('g', [], arguments);
};


mySvg.polygon = function (parent, path, attributes) {
    var
        element = mySvg.document.createElementNS(mySvg.ns, 'polygon'),
        pathStr = mySvg.path(path),
        name;

    element.setAttribute('points', pathStr);
    for (name in attributes) {
        if (typeof attributes[name] !== 'function') {
            element.setAttribute(name, attributes[name]);
        }
    }
    parent.appendChild(element);
    return element;
}


mySvg.change = function (item, attributes) {
    for (name in attributes) {
        if (typeof attributes[name] !== 'function') {
            item.setAttribute(name, attributes[name]);
        }
    }
}



mySvg.path = function (list) {
    var i, str = '', l;
    for (i = 0; i < list.length; i += 1) {
        l = list[i];
        switch (typeof list[i]) {
        case 'string':
        case 'number':
            str += l + ' ';
            break;
        case 'object':
            str += l[0] + ',' + l[1] + ' ';
            break;
        default:
            throw new Error('bad list: ' + list);
        }
    }
    return str.trim();
};


mySvg.radGrad = function (settings) {
    var attributes, grad;
    attributes = utils.copyAttribs(settings, ["id", "fx", "fy", "cx", "cy", "r"]);
    grad = mySvg.create('radialGradient', attributes);
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
    var text, i, line = [], span = [], textArray;
    text = mySvg.create("text", {
        "text-anchor": settings.align || "middle",
        "font-family": "arial",
        "font-size": settings.fontSize || 20,
        y: settings.yTop,
        x: settings.x,
        fill: settings.color || "white",
        parent: settings.parent
    });

    textArray = (typeof settings.text === 'string') ? [settings.text] : settings.text;
    for (i = 0; i < textArray.length; i += 1) {
        line[i] = mySvg.document.createTextNode(textArray[i]);
        span[i] = mySvg.document.createElementNS(mySvg.ns, "tspan");
        span[i].appendChild(line[i]);
        mySvg.setAttrs(span[i], {
            dy: i ? "1em" : "0em",
            x: settings.x
        });
        text.appendChild(span[i]);
    }

    return {text: text, spans: span, lines: line};
};


//TEMP!!!
mySvg.setAttrs = mySvg.change;


mySvg.getRoot = function () {
    return mySvg.root;
};

