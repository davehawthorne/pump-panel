/*global svg utils*/
"use strict";

class OutletValve {

    #callback;
    #cursorToCentre;
    #cx;
    #cy;
    #grabbed = false;
    #knob;
    #knobBot;
    #knobR;
    #knobTop;
    #pos = 0.0;
    #sideways;
    #stork;
    #travel;
    #width;

    static #fills = {};

    constructor({cx, yTop, yBot, width, sideways, knobWidth, callback, height}) {

        this.#cx = cx;
        // this.#yTop = yTop;
        // this.#yBot = yBot;
        this.#width = width;
        this.#sideways = sideways;
        this.#callback = callback;
        // this.#height = height;
        this.#cy = (yTop + yBot) / 2;
        this.#travel = (this.#cy - yTop) * 1.5;

        // utils.append(priv, {
        //     grabbed: false,
        //     pos: 0.0,
        //     cy: cy,
        //     travel: travel,
        //     knobTop: cy - travel,
        //     knobBot: cy + travel,
        //     paintWidth: settings.knobWidth * 1.1,
        //     halfWidth: settings.width * 0.5,
        // const halfHeight: settings.height * 0.5,
        // });

        const storkWidth = knobWidth * 0.3;
        const slotWidth = knobWidth * 0.7;

        this.#knobR = knobWidth * 0.5;
        this.#knobTop = this.#cy - this.#travel;
        this.#knobBot = this.#cy + this.#travel;

        if (!("knobFill" in OutletValve.#fills)) {
            OutletValve.#fills.convexGaugeBevelFill = svg.radGrad({
                cx: 0.4, cy: 0.4,
                fx: 0.35, fy: 0.35,
                r: 0.25,
                c1: 'white', c2: 'black',
                id: 'knobFill'
            });
        }

        const group = svg.create("g", {});

        const slot = svg.create("line", {
            parent: group,
            x1: cx,
            x2: cx,
            y1: yTop,
            y2: yBot,
            style: `stroke-linecap: round; stroke: #303030; stroke-width: ${slotWidth}`
        });
        const slit = svg.create("line", {
            parent: group,
            x1: cx,
            x2: cx,
            y1: yTop,
            y2: yBot,
            style: "stroke: black; stroke-width: 1px;"
        });
        this.#stork = svg.create("line", {
            parent: group,
            style: `stroke-linecap: round; stroke: #606060; stroke-width: ${storkWidth}`
        });

        this.#knob = svg.create("circle", {
            parent: group,
            r: this.#knobR,
            fill: "url(#knobFill)"
        });

        const back = svg.create("rect", {
            parent: group,
            x: cx - width / 2,
            y: this.#cy - height / 2 - this.#knobR,
            width: width,
            height: height + 2 * this.#knobR,
            "fill-opacity": 0
        });

        back.addEventListener("mousedown", (evt) => this.mousedown(evt));
        back.addEventListener("mouseup", (evt) => this.mouseup(evt));
        back.addEventListener("mouseout", (evt) => this.mouseout(evt));
        back.addEventListener("mousemove", (evt) => this.mousemove(evt));

        this.#drawHandle(this.#knobTop);
    }

    mousedown (evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        this.#grabHandle(svg.eventCoord(evt).y);
    }

    mouseup(evt) {
        this.#grabbed = false;
        this.#deactivate();
    }

    mouseout(evt) {
        if (this.#grabbed) {
            this.#moveHandle(svg.eventCoord(evt).y);
            this.#grabbed = false;
            this.#deactivate();
        }
    }

    mousemove(evt) {
        if (this.#grabbed) {
            this.#moveHandle(svg.eventCoord(evt).y);
        }
    }

    #drawHandle(cy) {
        const dy = this.#pos - 0.5;
        const theta = Math.asin(dy);
        const dx = Math.cos(theta);
        let cx;
        if (this.#sideways) {
            cx = this.#cx + 2.0 * this.#sideways * (dx - 0.5);
        } else {
            cx = this.#cx;
        }
        const yBase = this.#travel * Math.sin(theta) + this.#cy;
        svg.setAttrs(this.#knob, {cy: cy, cx: cx});
        svg.setAttrs(this.#stork, {y1: cy, x1: cx, x2: this.#cx, y2: yBase });

    }

    #grabHandle(clientY) {
        var
            knobY = parseInt(this.#knob.getAttributeNS(null, "cy"), 10);
        if (Math.abs(clientY - knobY) > this.#width) {
            return;
        }
        this.#grabbed = true;
        this.#cursorToCentre = clientY - knobY;
        this.#activate();
    }

    #moveHandle(clientY) {
        var cy;
        cy = clientY - this.#cursorToCentre;
        if (cy < this.#knobTop) {
            cy = this.#knobTop;
            this.#pos = 0.0;
        } else if (cy > this.#knobBot) {
            cy = this.#knobBot;
            this.#pos = 1.0;
        } else {
            this.#pos = (cy - this.#knobTop) / (2 * this.#travel);
        }
        this.#drawHandle(cy);
        if (this.#callback) {
            this.#callback(this.#pos);
        }
    }

    #deactivate() {
        svg.change(this.#knob, {
            r: this.#knobR,
        });
    }

    #activate() {
        svg.change(this.#knob, {
            r: this.#knobR * 1.5
        });
    }

    getPosition() {
        return this.#pos;
    }

    setCallback(callback) {
        this.#callback = callback;
        callback(this.#pos);
    }
};


class ToggleSwitch {

    #callback;
    #cy;
    #on;
    #tog;
    #width;

    constructor({cx, cy, width, initial=false, callback=null, height, text=null}) {
        this.#cy = cy;
        this.#callback = callback;
        this.#width = width;
        const halfWidth = width / 2;
        this.#on = initial;

        if (text) {
            svg.createText({
                x: cx,
                yTop: cy + width * 2,
                text: text
            });
        }

        const mount = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: halfWidth,
            style: "fill: black;"
        });

        mount.addEventListener("click", (evt) => this.#clickFunc(evt), false);

        this.#tog = svg.create("line", {
            x1: cx,
            x2: cx,
            y1: cy,
            y2: cy,
            style: `stroke-linecap: round; stroke: black; stroke-width: ${halfWidth}`
        });

        this.#tog.addEventListener("click", (evt) => this.#clickFunc(evt), false);
        this.#setFunc(this.#on);

    }

    #clickFunc(evt) {
        this.#on = !this.#on;
        this.#setFunc(this.#on);
        if (this.#callback) {
            this.#callback(this.#on);
        }
    }

    #setFunc(on) {
        if (on) {
            svg.setAttrs(this.#tog, {y2: this.#cy + this.#width});
        } else {
            svg.setAttrs(this.#tog, {y2: this.#cy - this.#width});
        }
    }

    isOn() {
        return this.#on;
    }

};

class PushButton {

    #butt;
    #callback;
    #pressing = false;
    #pressed = false;


    constructor({cx, cy, width, callback=null, height}) {
        this.#callback = callback;

        svg.createText({
            x: cx,
            yTop: cy + width,
            text: text
        });

        this.#butt = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: width / 2,
            fill: "black"
        });

        this.#butt.addEventListener("mousedown", (evt) => this.#buttonPress(evt), false);
        this.#butt.addEventListener("mouseout", (evt) => this.#buttonRelease(evt), false);
        this.#butt.addEventListener("mouseup", (evt) => this.#buttonRelease(evt), false);

    }

    #buttonPress(evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        this.#pressing = true;
        svg.setAttrs(this.#butt, {fill: "red"});
        if (this.#callback) {
            this.#callback(true);
        }
    };

    #buttonRelease(evt) {
        if (this.#pressing) {
            this.#pressing = false;
            svg.setAttrs(this.#butt, {fill: "black"});
            if (this.#callback) {
                this.#callback(false);
            }
        }
    };


    isPressing() {
        return this.#pressing;
    }

    wasPressed() {
        if (this.#pressed) {
            this.#pressed = this.#pressing;
            return true;
        } else {
            return false;
        }
    }
};
