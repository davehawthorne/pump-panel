/*global svg utils*/

"use strict";

var widgets = window.widgets || {};

if (!widgets.gauges) {
    widgets.gauges = {};
}

var
    //TEMP!!! lose these
    svgns = "http://www.w3.org/2000/svg",
    xlinkNS = "http://www.w3.org/1999/xlink";

/// used to generate the graduations on a gauge dial, these are built as just
/// three paths, each of a different thickness.
widgets.dialGraduations = function (cx, cy, r) {
    var
        thinLine = '',
        midLine = '',
        thickLine = '',
        lineCoords = function (angle, r1, r2) {
            var
                trim = utils.buildRounder(3),
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
        minor: function (angle) {
            thinLine += lineCoords(angle, r * 0.85, r * 0.75);
        },

        mid: function (angle) {
            thinLine += lineCoords(angle, r * 0.85, r * 0.70);
        },

        major: function (angle) {
            thinLine += lineCoords(angle, r * 0.85, r * 0.75);
            midLine += lineCoords(angle, r * 0.75, r * 0.65);
        },

        zero: function (angle) {
            thinLine += lineCoords(angle, r * 0.85, r * 0.75);
            thickLine += lineCoords(angle, r * 0.75, r * 0.70);
            midLine += lineCoords(angle, r * 0.70, r * 0.65);
        },

        draw: function (svg, color) {
            return [
                svg.create("path", {stroke: color, "stroke-width": 1, d: thinLine}),
                svg.create("path", {stroke: color, "stroke-width": 2, d: midLine}),
                svg.create("path", {stroke: color, "stroke-width": 4, d: thickLine})
            ];
        }
    };
};


widgets.placeText = function (settings, textArray) {
    var
        i,
        t,
        r = settings.radius;

    for (i = 0; i < textArray.length; i += 1) {
        t = textArray[i];
        svg.createText(
            {
                color: 'black',
                fontSize: 12,
                text: t[2],
                yTop: settings.cy + t[1] * r,
                x: settings.cx + t[0] * r,
                align: t[3]
            }
        );
    }
};


/// Creates the bevel, face and needle for a gauge.
/// Private method
///
widgets.gauges.baseGauge = function (backName, settings) {
    var
        back,
        needle,
        r = settings.radius,
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
        r: settings.radius,
        stroke: "black",
        fill: "url(#convexGaugeBevelFill)"
    });

    priv.concaveBevel = svg.create("circle", {
        //parent: priv.convexBevel,
        cx: cx,
        cy: cy,
        r: r * 0.95,
        stroke: "none",
        fill: "url(#concaveGaugeBevelFill)"
    });

    priv.face = svg.create("circle", {
        cx: cx,
        cy: cy,
        r: r * 0.9,
        stroke: "black",
        fill: "white"
    });

    needle = svg.document.createElementNS(svgns, "use");
    needle.setAttributeNS(xlinkNS, "href", "#needle");
    utils.setAttrs(needle, {x: cx - r, y: cy - r, width: 2 * r, height: 2 * r});
    if (!settings.parent) {
        settings.parent = svg.root;
    }
    settings.parent.appendChild(needle);

    return {
        setNeedle: function (angle) {
            needle.setAttribute("transform", "rotate(" + angle + "," + cx + "," + cy + ")");
        }
    };
};


/// Creates a high pressure outlet gauge: 0 to 4000kPa
widgets.gauges.highPressure = function (settings) {
    var
        base = widgets.gauges.baseGauge("#hpGauge", settings),
        a, i,
        r = settings.radius,
        grad = widgets.dialGraduations(settings.cx, settings.cy, r);

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
            break;
        default:
            grad.minor(a);
        }
        i += 1;

    }
    grad.draw(svg, "black");

    widgets.placeText(
        settings,
        [
            [-0.4, 0.5, '0', 'start'],
            [-0.65, -0.1, '1000', 'start'],
            [0.0, -0.55, '2000', 'middle'],
            [0.65, -0.1, '3000', 'end'],
            [0.4, 0.5, '4000', 'end']
        ]
    );

    return {
        showPressure: function (p) {
            var a;
            if (p < 0 || isNaN(p)) {
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
        r = settings.radius,
        grad = widgets.dialGraduations(settings.cx, settings.cy, r);


    grad.zero(45);
    for (a = 45 + 5.4, i = 1; a <= 315; a += 5.4)
    {

        if (i === 10) {
            grad.major(a);
            i = 0;
        } else if (i % 2 === 1) {  // odd value
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
            [-0.45, 0.45, '0', 'start'],
            [-0.60, -0.1, '500', 'start'],
            [-0.4, -0.45, '1000', 'start'],
            [0.4, -0.45, '1500', 'end'],
            [0.6, -0.1, '2000', 'end'],
            [0.45, 0.45, '2500', 'end'],
            [0.0, 0.6, 'kPa', 'middle']
        ]
    );

    return {
        showPressure: function (p) {
            var a;
            if (p < 0 || isNaN(p)) {
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
        r = settings.radius,
        grad = widgets.dialGraduations(settings.cx, settings.cy, r);

    grad.zero(45);
    for (a = 45 + 5.4, i = 1; a <= 315; a += 5.4)
    {

        if (i === 10) {
            grad.major(a);
            i = 0;
        } else if (i === 5) {
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
            [-0.5, 0.4, '0', 'start'],
            [-0.65, -0.1, '1000', 'start'],
            [-0.45, -0.4, '2000', 'start'],
            [0.45, -0.4, '3000', 'end'],
            [0.65, -0.1, '4000', 'end'],
            [0.5, 0.4, '5000', 'end'],
            [0.0, 0.6, 'RPM', 'middle']
        ]
    );

    return {
        showPressure: function (rpm) {
            var a;
            if (rpm < 0 || isNaN(rpm)) {
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
        r = settings.radius,
        redGrad = widgets.dialGraduations(settings.cx, settings.cy, settings.radius),
        blackGrad = widgets.dialGraduations(settings.cx, settings.cy, settings.radius);

    for (a = 180 - 7, i = 1; a >= 40; a -= 7) {
        switch (i) {
        case 0:
            redGrad.major(a);
            i += 1;
            break;
        case 1:
            redGrad.minor(a);
            i += 1;
            break;
        case 2:
            redGrad.mid(a);
            i += 1;
            break;
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
        if (i === 0) {
            blackGrad.major(a);
        } else {
            blackGrad.minor(a);
        }
        i = (i + 1) % 4;  // modulo 4 increment
    }

    redGrad.draw(svg, 'red');
    blackGrad.draw(svg, 'black');



    widgets.placeText(
        settings,
        [
            [-0.3, -0.5, "-20", 'start'],
            [-0.6, -0.25, "-40", 'start'],
            [-0.7, 0, "-60", 'start'],
            [-0.6, 0.25, "-80", 'start'],
            [-0.5, 0.4, "-100", 'start'],
            [0.0, -0.55, "0", 'center'],
            [0.3, -0.5, "100", 'end'],
            [0.4, -0.4, "400", 'end'],
            [0.6, -0.15, "800", 'end'],
            [0.6, 0.15, "1200", 'end'],
            [0.6, 0.4, "1600", 'end'],
            [0.0, 0.6, 'kPa', 'middle']
        ]
    );

    return {
        showPressure: function (p) {
            var a;
            if (p < -100 || isNaN(p)) {
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
    utils.setAttrs(priv.mount, {
        cx: priv.cx,
        cy: priv.cy,
        r: settings.width / 2,
        fill: "#880000"
    });
    utils.setAttrs(priv.textElem, {
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




