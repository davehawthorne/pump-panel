"use strict";
/*global svg */

var widgets = window.widgets || {};

widgets.general = (function () {
    var spinnerBase = function (x, y, w, h, init, incFn, decFn, parent) {
        var
            g = svg.create("g", {
                parent: parent
            }),

            r = svg.create("rect", {
                x: x,
                y: y,
                width: w,
                height: h,
                parent: g
            }),

            up = svg.create("path", {
                d: svg.path(['M', [x + h * 0.05, y + h * 0.45], [x + h * 0.5, y + h * 0.05], [x + h * 0.95, y + h * 0.45]]),
                "stroke-width": 0,
                parent: g

            }),

            down = svg.create("path", {
                d: svg.path(['M', [x + h * 0.05, y + h * 0.55], [x + h * 0.5, y + h * 0.95], [x + h * 0.95, y + h * 0.55]]),
                "stroke-width": 0,
                parent: g
            }),

            val = init,

            text = svg.createText({
                text: init,
                x: x + h * 1.1,
                yTop: y + h * 0.8,
                align: 'start',
                fill: 'white',
                fontFamily: 'Verdana',
                fontSize: h * 0.8,
                parent: g
            }),

            change = function (evt, val, key) {
                evt.preventDefault();
                if (val === null) {

                    text.text.setAttribute('fill', 'red');
                } else {
                    text.lines[0].nodeValue = val;
                }
                key.setAttribute('fill', 'red');
            },

            clear = function (evt) {

                up.setAttribute('fill', 'blue');
                down.setAttribute('fill', 'blue');
                text.text.setAttribute('fill', 'white');

            };

        up.addEventListener("mousedown", function (evt) {
            change(evt, incFn(), up);
        }, false);
        down.addEventListener("mousedown", function (evt) {
            change(evt, decFn(), down);
        }, false);
        up.addEventListener("mouseup", clear, false);
        down.addEventListener("mouseup", clear, false);
        up.addEventListener("mouseout", clear, false);
        down.addEventListener("mouseout", clear, false);

        clear();

    };

    return {
        numSpinner: function (s) {
            var
                min = s.min || 0,
                val = s.hasOwnProperty('initial') ? s.initial : min,
                step = s.step || 1,
                digits = s.digits || 0,
                callback = s.callback || 0,
                tail = s.hasOwnProperty('units') ? s.units : '',

                text = function () {
                    return val.toFixed(digits) + tail;
                },

                inc = function () {
                    if (val >= s.max) {
                        return null;
                    }
                    val = Math.min(s.max, val + step);
                    if (callback) {
                        callback(val);
                    }
                    return text();
                },
                dec = function () {
                    if (val <= min) {
                        return null;
                    }
                    val = Math.max(min, val - step);
                    if (callback) {
                        callback(val);
                    }
                    return text();
                };
            spinnerBase(s.x, s.y, s.width, s.height, text(), inc, dec, s.parent);

            return {
                value: function () {
                    return val;
                },
                setCallback: function (cb) {
                    callback = cb;
                    callback(val);
                }
            };
        },


        listSpinner: function (s) {
            var
                i = 0,
                max = s.values.length - 1,
                callback = s.callback || 0,

                inc = function () {
                    i = (i < max) ? (i + 1) : 0;
                    if (callback) {
                        callback(i);
                    }

                    return s.values[i];
                },
                dec = function () {
                    i = (i > 0) ? (i - 1) : max;
                    if (callback) {
                        callback(i);
                    }
                    return s.values[i];
                };
            spinnerBase(s.x, s.y, s.width, s.height, s.values[0], inc, dec, s.parent);
            return {
                value: function () {
                    return i;
                },
                setCallback: function (cb) {
                    callback = cb;
                    callback(i);
                }
            };
        }
    };
})();


