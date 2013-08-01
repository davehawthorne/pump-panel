/*global svg widgets utils*/
"use strict";

var widgets;        //TEMP!!!

if (!widgets) {
    widgets = {};
}
if (!widgets.gauges) {
    widgets.gauges = {};
}


widgets.gauges.lampFill = function (settings) {
    var
        lampGradCommon = {cx: 0.4, cy: 0.4, fx: 0.25, fy: 0.25, r: 0.25, c1: 'white'},
        rgb = settings.colour,
        dullColour = [Math.round(rgb[0] / 2), Math.round(rgb[1] / 2), Math.round(rgb[2] / 2)],
        glow,
        globe,
        matrixStr;

    if (!widgets.gauges.fills) {
        svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'white', c2: 'grey', id: "convexLampBevelFill"});
        svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'grey', c2: 'white', id: "concaveLampBevelFill"});
        widgets.gauges.fills = {};

    }

    if (!widgets.gauges.fills[settings.id]) {
        globe = svg.radGrad(utils.shallowMerge(lampGradCommon, {
            c2: svg.rgb2str(dullColour),
            id: 'globe' + settings.id
        }));
        glow = svg.create('filter', {id: 'glow' + settings.id, x: "-20%", y: "-20%", width: "140%", height: "140%"});
        matrixStr =
            "0 0 0 " + rgb[0].toString() + " 0 " +
            "0 0 0 " + rgb[1].toString() + " 0 " +
            "0 0 0 " + rgb[2].toString() + " 0 " +
            "0 0 0 1 0";
        svg.create('feColorMatrix', {parent: glow, type: "matrix", values: matrixStr});
        svg.create('feGaussianBlur', {parent: glow, result: "coloredBlur", stdDeviation: 5});
        widgets.gauges.fills[settings.id] = {globe: globe, glow: glow};
    }
};


widgets.gauges.lamp = function (settings) {
    var priv, rgb;
    priv = utils.copyAttribs(settings, ['cx', 'cy', 'rBevel', 'rGlobe', 'colour', 'colourId']);

    widgets.gauges.lampFill({colour: priv.colour, id: priv.colourId});

    priv.convexBevel = svg.create("circle", {
        parent: settings.parent,
        cx: priv.cx,
        cy: priv.cy,
        r: priv.rBevel,
        stroke: "black",
        fill: "url(#convexLampBevelFill)"
    });
    priv.concaveBevel = svg.create("circle", {
        //parent: priv.convexBevel,
        cx: priv.cx,
        cy: priv.cy,
        r: (priv.rBevel + priv.rGlobe) / 2,
        stroke: "none",
        fill: "url(#concaveLampBevelFill)"
    });
    priv.bulb = svg.create("circle", {
        //parent: priv.convexBevel,
        cx: priv.cx,
        cy: priv.cy,
        r: priv.rGlobe,
        stroke: "none",
        fill: "url(#globe" + priv.colourId + ")"
    });
    priv.glow = svg.create("circle", {
        //parent: priv.convexBevel,
        cx: priv.cx,
        cy: priv.cy,
        r: priv.rBevel,
        stroke: "none",
        filter: "url(#glow" + priv.colourId + ")",
        visibility: 'hidden'
    });
    return {
        set: function (on) {
            priv.glow.setAttribute('visibility', on ? 'inherit' : 'hidden');
        }
    };
};

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
            colour: i ? [255, 127, 0] : [255, 0, 0]
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

            var lampsOn = Math.floor(level * 4);
            if (lampsOn > priv.currentLampsOn) {
                for (i = priv.currentLampsOn; i < lampsOn; i += 1) {
                    priv.lamp[i + 1].set(true);
                }
                if (priv.currentLampsOn === 0) {
                    priv.lamp[0].set(false);
                }
                priv.currentLampsOn = lampsOn;
            } else if (lampsOn < priv.currentLampsOn) {
                for (i = lampsOn; i < priv.currentLampsOn; i += 1) {
                    priv.lamp[i + 1].set(false);
                }
                if (lampsOn === 0) {
                    priv.lamp[0].set(true);
                }
                priv.currentLampsOn = lampsOn;
            }
        }
    };
};

