"use strict";
/*global svg */

// no state value
class SpinnerBase {
    #up;
    #down;
    #text;

    constructor({x, y, width, height, parent=null}) {

        const g = svg.create("g", {
            parent: parent
        });

        svg.create("rect", {
            x: x,
            y: y,
            width: width,
            height: height,
            parent: g
        });

        this.#up = svg.create("path", {
            d: svg.path(['M', [x + height * 0.05, y + height * 0.45], [x + height * 0.5, y + height * 0.05], [x + height * 0.95, y + height * 0.45]]),
            "stroke-width": 0,
            parent: g

        });

        this.#down = svg.create("path", {
            d: svg.path(['M', [x + height * 0.05, y + height * 0.55], [x + height * 0.5, y + height * 0.95], [x + height * 0.95, y + height * 0.55]]),
            "stroke-width": 0,
            parent: g
        });

        this.#text = svg.createText({
            text: 'hi',
            x: x + height * 1.1,
            yTop: y + height * 0.8,
            align: 'start',
            fill: 'white',
            fontFamily: 'Verdana',
            fontSize: height * 0.8,
            parent: g
        });

        this.#up.addEventListener("mousedown", (evt) => this.change(evt, this.incFn(), 'up'));
        this.#down.addEventListener("mousedown", (evt) => this.change(evt, this.decFn(), 'down'));
        this.#up.addEventListener("mouseup", (evt) => this.clear());
        this.#down.addEventListener("mouseup", (evt) => this.clear());
        this.#up.addEventListener("mouseout", (evt) => this.clear());
        this.#down.addEventListener("mouseout", (evt) => this.clear());

        this.clear();
    }

    change(evt, displayValue, key) {
        evt.preventDefault();
        if (displayValue === null) {

            this.#text.text.setAttribute('fill', 'red');
        } else {
            this.setText(displayValue);
        }
        if (key === 'up') {
            this.#up.setAttribute('fill', 'red');
        } else {
            this.#down.setAttribute('fill', 'red');
        }
    }

    clear() {

        this.#up.setAttribute('fill', 'blue');
        this.#down.setAttribute('fill', 'blue');
        this.#text.text.setAttribute('fill', 'white');

    };

    setText(textVal) {
        this.#text.lines[0].nodeValue = textVal;
    }

    static doNothing(args) {}


}

class NumSpinner extends SpinnerBase {

    #max;
    #min;
    #step;
    #value;
    #units;
    #digits;
    #callback;

    constructor({x, y, width, height, initial=null, parent=null, min=0, max, step=1, digits=0, callback=null, units=''}) {
        super({x: x, y: y, width: width, height:height, parent:parent});

        this.#max = max;
        this.#min = min;
        this.#units = units;
        this.#digits = digits;
        this.#step = step;

        this.#callback = callback || SpinnerBase.doNothing;

        this.#value = (initial !== null) ? initial : min;

        this.setText(this.#genText());
        this.#callback(this.#value);
    }

    #genText() {
        return this.#value.toFixed(this.#digits) + this.#units;
    }

    incFn() {
        if (this.#value >= this.#max) {
            return null;
        }
        this.#value = Math.min(this.#max, this.#value + this.#step);
        this.#callback(this.#value);
        return this.#genText();
    }

    decFn() {
        if (this.#value <= this.#min) {
            return null;
        }
        this.#value = Math.max(this.#min, this.#value - this.#step);
        this.#callback(this.#value);
        return this.#genText();
    };

    value() {
        return this.#value;
    }

    setCallback(callback) {
        this.#callback = callback;
        this.#callback(this.#value);
    }


}

class ListSpinner extends SpinnerBase {

    #index;
    #values;
    #max;
    #callback;

    constructor({x, y, width, height, parent=null, callback=null, values}) {

        super({x: x, y: y, width: width, height:height, parent:parent});
        this.#index = 0;
        this.#values = values;
        this.#max = values.length - 1;
        this.#callback = callback || SpinnerBase.doNothing;

        this.setText(this.#values[this.#index]);
        this.#callCallback();

    }

    incFn() {
        this.#index = (this.#index < this.#max) ? (this.#index + 1) : 0;
        this.#callCallback();
        return this.#values[this.#index];
    }

    decFn() {
        this.#index = (this.#index > 0) ? (this.#index - 1) : this.#max;
        this.#callCallback();
        return this.#values[this.#index];
    }

    value() {
        return this.#values[this.#index];
    }

    index() {
        return this.#index;
    }

    setCallback(callback) {
        this.#callback = callback;

    }

    #callCallback() {
        this.#callback(this.#index, this.#values[this.#index]);
    }

    setItems(items) {
        this.#values = items;
        this.#max = items.length - 1;
        if (this.#index > this.#max) {
            this.#index = this.#max;
        }
        this.#callCallback();
        this.setText(this.#values[this.#index]);
    }

}
