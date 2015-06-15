"use strict";

/*global svg*/

var utils = {};


// Add a method conditionally.
Function.prototype.method = function (name, func) {
    if (!this.prototype[name]) {
        this.prototype[name] = func;
        return this;
    }
};


if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        var F = function () {};
        F.prototype = o;
        return new F();
    };
}


Function.method('curry', function () {
    var slice = Array.prototype.slice,
        args = slice.apply(arguments),
        that = this;
    return function () {
        return that.apply(null, args.concat(slice.apply(arguments)));
    };
});



utils.shallowMerge = function () {
    var merged = {}, i, j, arg;
    for (j = 0; j < arguments.length; j += 1) {
        arg = arguments[j];
        for (i in arg) {
            if (typeof arg[i] !== 'function') {
                merged[i] = arg[i];
            }
        }
    }
    return merged;
};


utils.append = function (obj, extra) {
    var i;
    for (i in extra) {
        if (typeof extra[i] !== 'function') {
            obj[i] = extra[i];
        }
    }
};

utils.keysStr = function (obj) {
    var i, str = "";
    for (i in obj) {
        if (typeof obj[i] === 'function') {
            str += i + ": function, ";
        } else {
            str += i + ": " + obj[i] + ", ";
        }
    }
    return str;
};


utils.copyAttribs = function (orig, attrList) {
    var i, attr, copy = {};
    for (i = 0; i < attrList.length; i += 1) {
        attr = attrList[i];
        if (orig[attr] === undefined) {

            throw new Error('missing param: ' + attr + ' from ' + utils.keysStr(orig));
        }
        if (copy[attr] !== undefined) {
            throw new Error('extra param: ' + attr);
        }
        copy[attr] = orig[attr];
    }
    return copy;
};



/// Return a function that rounds a value to the specified number of digits
/// after the decimal point.
utils.buildRounder = function (decimals) {
    var factor = Math.pow(10, decimals);
    return function (val) {
        return Math.round(factor * val) / factor;
    };
};



/// Augments the jquery svg library
var changeableText = function (svg, parent, initial, attributes) {
    var
        textNode = svg.document.createTextNode(initial),
        text = svg.document.createElementNS("http://www.w3.org/2000/svg", "text");

    //TEMP!!!svg.change(attributes)
    text.appendChild(textNode);
    parent.appendChild(text);

    return {
        text : text,
        change : function (value) {
            textNode.nodeValue = value;
        }
    };
};


utils.timerHeart = function (ticksPerSec) {
    var
        interval = 1000 / ticksPerSec,
        ticks = 0,
        ticker = null,
        callbacks = [],
        maxProcTime = 0,
        totProcTime = 0,
        tickTask = function () {
            var
                len = callbacks.length,
                i,
                start,
                procTime,
                delta;

            ticks += 1;
            start = new Date().getTime();
            for (i = 0; i < len; i += 1) {
                callbacks[i]();
            }
            procTime = new Date().getTime() - start;
            totProcTime += procTime;
            if (procTime > maxProcTime) {
                maxProcTime = procTime;
            }
        };

    return {
        addCallback: function (fn) {
            callbacks.push(fn);
        },
        start: function () {
            if (ticker) {
                throw {name: 'bad state', message: 'ticker already started'};
            }
            ticker = setInterval(tickTask, interval);
        },
        stop: function () {
            if (!ticker) {
                throw {name: 'bad state', message: 'ticker already stopped'};
            }
            clearInterval(ticker);
            ticker = null;
        },
        step: function () {
            if (ticker) {
                throw {name: 'bad state', message: 'ticker already running'};
            }
            tickTask();
        },
        getInfo: function () {
            return {
                running: ticker !== null,
                elapsed: ticks / ticksPerSec,  // seconds
                maxLoad: maxProcTime / interval,  // 0 - 1
                aveLoad: ticks ? (totProcTime / (ticks * interval)) : 0  // 0 - 1
            };
        }
    };
};


utils.timerInterface = function (parent, x, y, h, heart)
{
    var
        g = svg.group(parent, {transform: "translate(" + x + "," + y + ")"}),
        fieldDisplays = [],

        step = svg.circle(g, h * 0.7, h * 0.15, h * 0.15, {fill: 'blue', stroke: 'black'}),
        control = svg.group(g),
        play = svg.polygon(control, [[h * 0.1, h * 0.1], [h * 0.9, h * 0.5], [h * 0.1, h * 0.9]], {fill: 'green', stroke: 'black'}),
        pause = svg.group(control, {fill: 'none', stroke: 'none'}),
        pad2 = function (val) {
            val = val.toString();
            while (val.length < 2) {
                val = '0' + val;
            }
            return val;
        },
        state = {
            mins: 0,
            secs: 0,
            subs: 0,
            aver: 0,
            peak: 0
        },
        field,
        toggle = function () {
            if (heart.getInfo().running) {
                heart.stop();
                svg.change(play, {fill: 'green', stroke: 'black'});
                svg.change(pause, {fill: 'none', stroke: 'none'});
                svg.change(step, {fill: 'blue', stroke: 'black'});
            } else {
                heart.start();
                svg.change(play, {fill: 'none', stroke: 'none'});
                svg.change(pause, {fill: 'red', stroke: 'black'});
                svg.change(step, {fill: 'none', stroke: 'none'});
            }
        },
        update = function () {
            var
                field,
                info = heart.getInfo(),
                newState = {
                    mins: Math.floor(info.elapsed / 60),
                    secs: Math.floor(info.elapsed % 60),
                    subs: Math.round(100 * (info.elapsed % 1)),
                    aver: Math.floor(info.aveLoad * 100),
                    peak: Math.floor(info.maxLoad * 100)
                };

            for (field in state) {
                if (state[field] !== newState[field]) {
                    fieldDisplays[field].change(pad2(newState[field]));
                }
            }
            state = newState;
        };

    svg.rect(pause, h * 0.1, h * 0.15, h * 0.8, h * 0.3);
    svg.rect(pause, h * 0.1, h * 0.55, h * 0.8, h * 0.3);
    svg.circle(g, h * 2.1, h * 0.3, h * 0.05, {fill: 'grey'});
    svg.circle(g, h * 2.1, h * 0.7, h * 0.05, {fill: 'grey'});
    svg.circle(g, h * 3.2, h * 0.50, h * 0.05, {fill: 'grey'});

    for (field in state) {
        if (typeof state[field] !== 'function') {
            fieldDisplays[field] = changeableText(svg, g, pad2(state[field]));
        }
    }
    svg.change(fieldDisplays.mins.text, {x: h * 1.1, y: h * 0.8, fill: 'white', 'font-size': h * 0.8});
    svg.change(fieldDisplays.secs.text, {x: h * 2.2, y: h * 0.8, fill: 'white', 'font-size': h * 0.8});
    svg.change(fieldDisplays.subs.text, {x: h * 3.3, y: h * 0.8, fill: 'white', 'font-size': h * 0.8});
    svg.change(fieldDisplays.aver.text, {x: h * 4.4, y: h * 0.4, fill: 'white', 'font-size': h * 0.4});
    svg.change(fieldDisplays.peak.text, {x: h * 4.4, y: h * 0.8, fill: 'white', 'font-size': h * 0.4});

    update();

    heart.addCallback(update);

    control.addEventListener("click", toggle, false);
    step.addEventListener("click", function () {
        heart.step();
    }, false);

    return g;
};


/// squareroot function
utils.sqrt = function (x) {
    return Math.pow(x, 0.5);
};


/// square function
utils.sq = function (x) {
    return x * x;
};


/// Helper function
utils.setAttrs = function (element, atts) {
    var atName;
    for (atName in atts) {
        if (typeof atts[atName] !== 'function') {
            element.setAttribute(atName, atts[atName]);
        }
    }
};


utils.handleException = function (ex) {
    var
//        err = new Error();
//    return err.stack;
//}
        msg = "EX " + typeof ex + ' "' + ex.message + '" ' + ex.fileName + ':' + ex.lineNumber + '\n' + ex.stack;
    alert(msg);
};

