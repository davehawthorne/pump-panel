/*global svg utils*/
"use strict";

var widgets = window.widgets || {};

if (!widgets.controls) {
    widgets.controls = {};
}

var temp;

widgets.controls.outletValve = function (settings) {
    var priv, drawHandle, cy, travel;

    priv = utils.copyAttribs(settings, [
        'cx', 'yTop', 'yBot', 'width', 'sideways', 'knobWidth', 'callback', 'height'
    ]);

    cy = (settings.yTop + settings.yBot) / 2;
    travel = (cy - settings.yTop) * 1.5;
    utils.append(priv, {
        grabbed: false,
        pos: 0.0,
        cy: cy,
        travel: travel,
        knobTop: cy - travel,
        knobBot: cy + travel,
        paintWidth: settings.knobWidth * 1.1,
        storkWidth: settings.knobWidth * 0.3,
        slotWidth: settings.knobWidth * 0.7,
        halfWidth: settings.width * 0.5,
        halfHeight: settings.height * 0.5,
        knobR: settings.knobWidth * 0.5
    });

    temp = priv;

    if (!widgets.controls.fills) {
        widgets.controls.fills = {};
    }
    if (!widgets.controls.fills.knob) {
        widgets.controls.fills.knob = svg.radGrad({
            cx: 0.4,
            cy: 0.4,
            fx: 0.35,
            fy: 0.35,
            r: 0.25,
            c1: 'white',
            c2: 'black',
            id: 'knobFill'
        });
    }

    drawHandle = function (cy) {
        var dy, dx, theta, cx, yBase;
        dy = priv.pos - 0.5;
        theta = Math.asin(dy);
        dx = Math.cos(theta);
        if (settings.sideways) {
            cx = priv.cx + 2.0 * priv.sideways * (dx - 0.5);
        } else {
            cx = priv.cx;
        }
        yBase = priv.travel * Math.sin(theta) + priv.cy;
        svg.setAttrs(priv.knob, {cy: cy, cx: cx});
        svg.setAttrs(priv.stork, {y1: cy, x1: cx, x2: priv.cx, y2: yBase });

    };

    priv.group = svg.create("g", {});

    priv.paint = svg.create("line", {
        parent: priv.group,
        x1: priv.cx,
        x2: priv.cx,
        y1: priv.yTop,
        y2: priv.yBot,
        style: "stroke-linecap: round; stroke: #303080; stroke-width: " + priv.paintWidth.toString()
    });
    priv.slot = svg.create("line", {
        parent: priv.group,
        x1: priv.cx,
        x2: priv.cx,
        y1: priv.yTop,
        y2: priv.yBot,
        style: "stroke-linecap: round; stroke: #101010; stroke-width: " + priv.slotWidth.toString()
    });
    priv.slit = svg.create("line", {
        parent: priv.group,
        x1: priv.cx,
        x2: priv.cx,
        y1: priv.yTop,
        y2: priv.yBot,
        style: "stroke: black; stroke-width: 1px;"
    });
    priv.stork = svg.create("line", {
        parent: priv.group,
        style: "stroke-linecap: round; stroke: #303030; stroke-width: " + priv.storkWidth.toString()
    });

    priv.knob = svg.create("circle", {
        parent: priv.group,
        r: priv.knobR,
        fill: "url(#knobFill)"
    });

    priv.back = svg.create("rect", {
        parent: priv.group,
        x: priv.cx - priv.halfWidth,
        y: priv.cy - priv.halfHeight - priv.knobR,
        width: priv.width,
        height: priv.height + 2 * priv.knobR,
        "fill-opacity": 0
    });

    drawHandle(priv.knobTop);

    priv.grabHandle = function (clientY) {
        var
            knobY = parseInt(priv.knob.getAttributeNS(null, "cy"), 10);
        if (Math.abs(clientY - knobY) > priv.width) {
            return;
        }
        priv.grabbed = true;
        priv.cursorToCentre = clientY - knobY;
    };
    priv.moveHandle = function (clientY) {
        var cy;
        cy = clientY - priv.cursorToCentre;
        if (cy < priv.knobTop) {
            cy = priv.knobTop;
            priv.pos = 0.0;
        } else if (cy > priv.knobBot) {
            cy = priv.knobBot;
            priv.pos = 1.0;
        } else {
            priv.pos = (cy - priv.knobTop) / (2 * priv.travel);
        }
        drawHandle(cy);
        if (priv.callback) {
            priv.callback(priv.pos);
        }
    };

    priv.back.addEventListener("mousedown", function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        priv.grabHandle(evt.clientY);
    }, false);

    priv.back.addEventListener("mouseup", function (evt) {
        priv.grabbed = false;
    }, false);

    priv.back.addEventListener("mouseout", function (evt) {
        if (priv.grabbed) {
            priv.moveHandle(evt.clientY);
            priv.grabbed = false;
        }
    }, false);

    priv.back.addEventListener("mousemove", function (evt) {
        if (priv.grabbed) {
            priv.moveHandle(evt.clientY);
        }
    }, false);


    return {
        getPosition: function () {
            return priv.pos;
        }
    };
};


widgets.controls.toggleSwitch = function (settings) {
    var
        priv = {
            cx: settings.cx,
            cy: settings.cy,
            width: settings.width,
            halfWidth: settings.width / 2,
            callback: settings.callback,
            on: settings.initial || false,
            clickFunc: null,
            setFunc: null
        },
        i, line, span;

    priv.setFunc = function (on) {
        if (on) {
            svg.setAttrs(priv.tog, {y2: priv.cy + priv.width});
        } else {
            svg.setAttrs(priv.tog, {y2: priv.cy - priv.width});
        }
    };

    priv.clickFunc = function (evt) {
        priv.on = !priv.on;
        priv.setFunc(priv.on);
        if (priv.callback) {
            priv.callback(priv.on);
        }
    };

    priv.text = svg.createText({
        cx: priv.cx,
        yTop: priv.cy + priv.width * 2,
        text: settings.text
    });

    priv.mount = svg.create("circle", {
        cx: priv.cx,
        cy: priv.cy,
        r: priv.width / 2,
        style: "fill: black;"
    });

    priv.mount.addEventListener("click", priv.clickFunc, false);

    priv.tog = svg.create("line", {
        x1: priv.cx,
        x2: priv.cx,
        y1: priv.cy,
        y2: priv.cy,
        style: "stroke-linecap: round; stroke: black; stroke-width: " + priv.halfWidth.toString()
    });

    priv.tog.addEventListener("click", priv.clickFunc, false);
    priv.setFunc(priv.on);
    return {
        isOn: function () {
            return priv.on;
        }
    };

};


widgets.controls.pushButton = function (settings) {
    var
        priv = {
            cx: settings.cx,
            cy: settings.cy,
            width: settings.width,
            halfWidth: settings.width / 2,
            callback: settings.callback,
            pressing: false,
            pressed: false
        },
        i, line, span;

    priv.text = svg.createText({
        cx: priv.cx,
        yTop: priv.cy + priv.width,
        text: settings.text
    });

    priv.butt = svg.create("circle", {
        cx: priv.cx,
        cy: priv.cy,
        r: priv.width / 2,
        fill: "black"
    });

    priv.buttonPress = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        priv.pressing = true;
        svg.setAttrs(priv.butt, {fill: "red"});
        if (priv.callback) {
            priv.callback(true);
        }
    };

    priv.buttonRelease = function (evt) {
        if (priv.pressing) {
            priv.pressing = false;
            svg.setAttrs(priv.butt, {fill: "black"});
            if (priv.callback) {
                priv.callback(false);
            }
        }
    };

    priv.butt.addEventListener("mousedown", priv.buttonPress, false);
    priv.butt.addEventListener("mouseout", priv.buttonRelease, false);
    priv.butt.addEventListener("mouseup", priv.buttonRelease, false);

    return {
        isPressing: function () {
            return priv.pressing;
        },
        wasPressed: function () {
            if (priv.pressed) {
                priv.pressed = priv.pressing;
                return true;
            } else {
                return false;
            }
        }
    };
};


