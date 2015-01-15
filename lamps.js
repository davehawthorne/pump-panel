/*global svg widgets utils*/
"use strict";

var widgets;        //TEMP!!!

if (!widgets) {
    widgets = {};
}
if (!widgets.gauges) {
    widgets.gauges = {};
}


// This method is only called by widgets.gauges.lamp()
//
// The glow of the lamps when turned on and the gradients of lamp bevels and
// lamp surfaces.
// rgb is an RGB integer array (3 values from 0 to 255)
//
// The light source is taken to be to the upper left of the panel.
// On first call two linear gradients are created for the silver coloured bevel surrounding the lamps.
// The outer one is lighter on the top left, the inner one is lighter on the bottom right.
//
// Each unilluminated lamp has a radial colour gradient which mimics the external light reflected off
// its round surface.  One such gradient is generated for each lamp colour and its name is generated
// from the RGB values.
// Similarly a guassian blur is created for each lamp colour.  This is used to signify the lamp is on.
widgets.gauges.lampFill = function (rgb, id) {
    var
        lampGradCommon = {cx: 0.4, cy: 0.4, fx: 0.25, fy: 0.25, r: 0.25, c1: 'white'},
        dullColour = [Math.round(rgb[0] / 2), Math.round(rgb[1] / 2), Math.round(rgb[2] / 2)],
        glow,
        globe,
        matrixStr;

    if (!widgets.gauges.fills) {
        svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'white', c2: 'grey', id: "convexLampBevelFill"});
        svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'grey', c2: 'white', id: "concaveLampBevelFill"});
        widgets.gauges.fills = {};

    }

    if (!widgets.gauges.fills[id]) {
        globe = svg.radGrad(utils.shallowMerge(lampGradCommon, {
            c2: svg.rgb2str(dullColour),
            id: 'globe' + id
        }));
        glow = svg.create('filter', {id: 'glow' + id, x: "-20%", y: "-20%", width: "140%", height: "140%"});
        matrixStr =
            "0 0 0 " + (rgb[0] / 255).toString() + " 0 " +
            "0 0 0 " + (rgb[1] / 255).toString() + " 0 " +
            "0 0 0 " + (rgb[2] / 255).toString() + " 0 " +
            "0 0 0 1 0";
        svg.create('feColorMatrix', {parent: glow, type: "matrix", values: matrixStr});
        svg.create('feGaussianBlur', {parent: glow, result: "coloredBlur", stdDeviation: 5});
        widgets.gauges.fills[id] = {globe: globe, glow: glow};
    }
};


// The logic for a single lamp.  Lamp has a bezel.
//
// There's only one method called: set().
//
// The parameters passed to the constructor are:
// - cx, cy: the location of the lamp centre
// - rBevel, rGlobe: the radii of the components, bevel should be bigger than globe
// - colour: a three value array containing the RGB value of the illuminated globe
//   (extingished lamp has these values halved.)
//
// The glow of the lamp, the shine of the bevel and the shine of the unlit lamp
// is acheived with the lampFill method.
widgets.gauges.lamp = function (settings) {
    var
        priv = utils.copyAttribs(settings, ['cx', 'cy', 'rBevel', 'rGlobe', 'colour', 'interval']),
        rgb = priv.colour,
        id = 'R' + rgb[0] + 'G' + rgb[1] + 'B' + rgb[2];

    widgets.gauges.lampFill(rgb, id);

    priv.lampLit = false;
    priv.convexBevel = svg.create("circle", {
        parent: settings.parent,
        cx: priv.cx,
        cy: priv.cy,
        r: priv.rBevel,
        stroke: "black",
        fill: "url(#convexLampBevelFill)"
    });
    priv.concaveBevel = svg.create("circle", {
        cx: priv.cx,
        cy: priv.cy,
        r: (priv.rBevel + priv.rGlobe) / 2,
        stroke: "none",
        fill: "url(#concaveLampBevelFill)"
    });
    priv.bulb = svg.create("circle", {
        cx: priv.cx,
        cy: priv.cy,
        r: priv.rGlobe,
        stroke: "none",
        fill: "url(#globe" + id + ")"
    });
    priv.glow = svg.create("circle", {
        cx: priv.cx,
        cy: priv.cy,
        r: priv.rBevel,
        stroke: "none",
        filter: "url(#glow" + id + ")",
        visibility: 'hidden'
    });

    priv.clearTimer = function () {
        if (priv.timer) {
            clearInterval(priv.timer);
        }
        priv.timer = null;
    };

    priv.setTimer = function (callback) {
        priv.timer = setInterval(callback, priv.interval);
    };

    priv.set = function (on) {
        if (priv.lampLit !== on) {
            priv.glow.setAttribute('visibility', on ? 'inherit' : 'hidden');
            priv.lampLit = on;
        }
    };

    priv.pulseFunc = function () {
        priv.clearTimer();
        priv.set(false);
    };

    priv.flashFunc = function () {
        priv.set(!priv.lampLit);
    };

    return {
        set: function (on) {
            priv.clearTimer();
            if (priv.lampLit !== on) {
                priv.set(on);
                priv.lampLit = on;
            }
        },
        pulse: function () {
            priv.clearTimer();
            priv.set(true);
            priv.setTimer(priv.pulseFunc);

        },
        flash: function () {
            priv.clearTimer();
            priv.flashState = true;
            priv.set(true);
            priv.setTimer(priv.flashFunc);
        }
    };
};

// LEVEL       STATE
// > 95%       all 4 amber on
// 75% - 95%   3 amber on
// 50% - 75%   2 amber on
// 25% - 50%   1 amber on
// <25%        red on
// 0%          red flashing
widgets.gauges.levelIndicator = function (settings) {
    var
        priv = {
            currentLampsOn: 0,
            lampDist: settings.lampDist,
            cx: settings.cx,
            yTop: settings.yTop,
            lamp: [],
            level: []
        },
        levelText = ["EMPTY", "1/4", "1/2", "3/4", "FULL"],
        i, y;

    svg.createText({
        text: settings.title,
        yTop: priv.yTop - priv.lampDist,
        cx: priv.cx + priv.lampDist / 2
    });

    for (i = 0; i < 5; i += 1) {
        y = priv.yTop + (4 - i) * priv.lampDist;
        priv.lamp[i] = widgets.gauges.lamp({
            cx: priv.cx,
            cy: y,
            rBevel: 20,
            rGlobe: 13,
            colourId: i ? "Amber" : "Red",
            colour: i ? [255, 127, 0] : [255, 0, 0],
            interval: 500
        });
        priv.level[i] = svg.createText({
            cx: priv.cx + priv.lampDist,
            yTop: y,
            text: levelText[i]
        });
    }
    priv.lamp[0].set(true);
    return {
        set: function (level) {
            if (level < 0 || level > 1) {
                throw {name: 'badParam', message: 'bad level fill:' + level.toString()};
            }



            var lampsOn;
            if (level > 0.95) {
                lampsOn = 4;
            } else if (level < 0.05) {
                lampsOn = -1;
            } else {
                lampsOn = Math.floor(level * 4);
            }

            if (lampsOn === priv.currentLampsOn) {
                return;
            }

            for (i = 1; i <= lampsOn; i += 1) {
                priv.lamp[i].set(true);
            }
            for (i = lampsOn + 1; i <= 4; i += 1) {
                priv.lamp[i].set(false);
            }
            if (lampsOn > 0) {
                priv.lamp[0].set(false);
            } else if (lampsOn === 0) {
                priv.lamp[0].set(true);
            } else {
                priv.lamp[0].flash();
            }
            priv.currentLampsOn = lampsOn;
        }
    };
};

