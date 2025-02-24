/*global svg widgets utils*/
"use strict";


// The logic for a single lamp.  Lamp has a bezel.
//
// There's only one method called: set().
//
// The parameters passed to the constructor are:
// - cx, cy: the location of the lamp centre
// - rBevel, rGlobe: the radii of the components, bevel should be bigger than globe
// - colour: a three value array containing the RGB value of the illuminated globe
//   (extinguished lamp has these values halved.)
//
// The glow of the lamp, the shine of the bevel and the shine of the unlit lamp
// is achieved with the buildLampFill method.
class Lamp {

    #lampLit;
    #id;
    #convexBevel;
    #concaveBevel;
    #bulb;
    #glow;
    #timer;
    #interval;

    static #fills = {};

    constructor({cx, cy, rBevel, rGlobe, colour, interval, parent}) {

        this.#interval = interval;
        this.#id = `R${colour[0]}G${colour[1]}B${colour[2]}`;
        Lamp.#buildLampFill(colour, this.#id);

        this.#lampLit = false;
        this.#convexBevel = svg.create("circle", {
            parent: parent,
            cx: cx,
            cy: cy,
            r: rBevel,
            stroke: "black",
            fill: "url(#convexLampBevelFill)"
        });
        this.#concaveBevel = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: (rBevel + rGlobe) / 2,
            stroke: "none",
            fill: "url(#concaveLampBevelFill)"
        });
        this.#bulb = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: rGlobe,
            stroke: "none",
            fill: `url(#globe${this.#id})`
        });
        this.#glow = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: rBevel,
            stroke: "none",
            filter: `url(#glow${this.#id})`,
            visibility: 'hidden'
        });
    };

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
    // Similarly a gaussian blur is created for each lamp colour.  This is used to signify the lamp is on.
    static #buildLampFill(rgb, id) {
        const lampGradCommon = {cx: 0.4, cy: 0.4, fx: 0.25, fy: 0.25, r: 0.25, c1: 'white'};
        const dullColour = [Math.round(rgb[0] / 2), Math.round(rgb[1] / 2), Math.round(rgb[2] / 2)];

        if (!("convexLampBevelFill" in Lamp.#fills)) {
            Lamp.#fills.convexLampBevelFill = svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'white', c2: 'grey', id: "convexLampBevelFill"});
            Lamp.#fills.concaveLampBevelFill = svg.linGrad({x1: 0, y1: 0, x2: 1, y2: 1, c1: 'grey', c2: 'white', id: "concaveLampBevelFill"});
        }

        if (!(id in Lamp.#fills)) {
            const globe = svg.radGrad(utils.shallowMerge(lampGradCommon, {
                c2: svg.rgb2str(dullColour),
                id: 'globe' + id
            }));
            const glow = svg.create('filter', {id: 'glow' + id, x: "-20%", y: "-20%", width: "140%", height: "140%"});
            const matrixStr =
                `0 0 0 ${rgb[0] / 255} 0 ` +
                `0 0 0 ${rgb[1] / 255} 0 ` +
                `0 0 0 ${rgb[2] / 255} 0 ` +
                `0 0 0 1 0`;
            svg.create('feColorMatrix', {parent: glow, type: "matrix", values: matrixStr});
            svg.create('feGaussianBlur', {parent: glow, result: "coloredBlur", stdDeviation: 5});
            Lamp.#fills[id] = {globe: globe, glow: glow};
        }
    };


    #clearTimer() {
        if (this.#timer) {
            clearInterval(this.#timer);
        }
        this.#timer = null;
    };

    #setLampState(on) {
        if (this.#lampLit !== on) {
            this.#glow.setAttribute('visibility', on ? 'inherit' : 'hidden');
            this.#lampLit = on;
        }
    };

    #pulseFunc() {
        this.#clearTimer();
        this.#setLampState(false);
    };

    #flashFunc() {
        this.#setLampState(!this.#lampLit);
    };

    set(on) {
        this.#clearTimer();
        if (this.#lampLit !== on) {
            this.#setLampState(on);
            this.#lampLit = on;
        }
    };

    pulse() {
        this.#clearTimer();
        this.#setLampState(true);
        this.#timer = setInterval(
            () => this.#pulseFunc(),
            this.#interval
        );

    };

    flash() {
        this.#clearTimer();
        this.#setLampState(true);
        this.#timer = setInterval(
            () => this.#flashFunc(),
            this.#interval
        );
    };
};

// LEVEL       STATE
// > 95%       all 4 amber on
// 75% - 95%   3 amber on
// 50% - 75%   2 amber on
// 25% - 50%   1 amber on
// <25%        red on
// 0%          red flashing
class LevelIndicator {

    #lamp = [];
    #level = [];
    #title;
    #currentLampsOn = 0;

    constructor({lampDist, cx, yTop, title}) {
        const levelText = ["EMPTY", "1/4", "1/2", "3/4", "FULL"];

        this.#title = svg.createText({
            text: title,
            yTop: yTop - lampDist,
            x: cx + lampDist / 2
        });

        for (let i = 0; i < 5; i += 1) {
            const y = yTop + (4 - i) * lampDist;
            this.#level[i] = svg.createText({
                x: cx + lampDist * 1.1,
                yTop: y,
                text: levelText[i]
            });
            this.#lamp[i] = new Lamp({
                cx: cx,
                cy: y,
                rBevel: 20,
                rGlobe: 13,
                colourId: i ? "Amber" : "Red",
                colour: i ? [255, 127, 0] : [255, 0, 0],
                interval: 500
            });
            this.#lamp[0].flash();
        }
    };

    set(level) {
        if (level < 0.0 || level > 1.0) {
            throw {name: 'badParam', message: `bad level fill: ${level}`};
        }

        let lampsOn;
        if (level > 0.95) {
            lampsOn = 4;
        } else if (level < 0.05) {
            lampsOn = -1;
        } else {
            lampsOn = Math.floor(level * 4);
        }

        if (lampsOn === this.#currentLampsOn) {
            return;
        }

        for (let i = 1; i <= lampsOn; i += 1) {
            this.#lamp[i].set(true);
        }
        for (let i = lampsOn + 1; i <= 4; i += 1) {
            this.#lamp[i].set(false);
        }
        if (lampsOn > 0) {
            this.#lamp[0].set(false);
        } else if (lampsOn === 0) {
            this.#lamp[0].set(true);
        } else {
            this.#lamp[0].flash();
        }
        this.#currentLampsOn = lampsOn;
    };
};


LevelIndicator = LevelIndicator;
