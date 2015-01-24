"use strict";
/*global svg */

var widgets = window.widgets || {};

widgets.general = (function () {
    var spinnerBase = function (crap, x, y, w, h, init, incFn, decFn, callback) {
        var
            r = svg.create("rect", {
                x: x,
                y: y,
                width: w,
                height: h
            }),

            up = svg.create("path", {
                d: svg.path(['M', [x + h * 0.05, y + h * 0.45], [x + h * 0.5, y + h * 0.05], [x + h * 0.95, y + h * 0.45]]),
                "stroke-width": 0

            }),

            down = svg.create("path", {
                d: svg.path(['M', [x + h * 0.05, y + h * 0.55], [x + h * 0.5, y + h * 0.95], [x + h * 0.95, y + h * 0.55]]),
                "stroke-width": 0
            }),

            val = init,
            text = svg.createText({text: init, x: x + h * 1.1, yTop: y + h * 0.8, align: 'start', fill: 'white', fontFamily: 'Verdana', fontSize: h * 0.8}),
            change = function (evt, val, key) {
                evt.preventDefault();
                if (val === null) {

                    text.text.setAttribute('fill', 'red');
                } else {
                    text.lines[0].nodeValue = val;
                    if (callback) {
                        callback(val);
                    }
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
        numSpinner: function (svg, x, y, w, h, min, max, step, digits, initial, callback) {
            var
                val = initial,
                inc = function () {
                    if (val >= max) {
                        return null;
                    }
                    val = Math.min(max, val + step);
                    return val.toFixed(digits);
                },
                dec = function () {
                    if (val <= min) {
                        return null;
                    }
                    val = Math.max(min, val - step);
                    return val.toFixed(digits);
                };
            spinnerBase(svg, x, y, w, h, val.toFixed(digits), inc, dec, callback);

            return {
                value : function () {
                    return val;
                }
            };
        },


        listSpinner: function (svg, x, y, w, h, vals, callback) {
            var
                i = 0,
                max = vals.length - 1,
                inc = function () {
                    i = (i < max) ? (i + 1) : 0;
                    return vals[i];
                },
                dec = function (val) {
                    i = (i > 0) ? (i - 1) : max;
                    return vals[i];
                };
            spinnerBase(svg, x, y, w, h, vals[0], inc, dec, callback);
            return {
                value : function () {
                    return i;
                }
            };
        }
    };
})();


