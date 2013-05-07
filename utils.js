"use strict";

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


utils.copyAttribs = function (orig, attrList) {
	var i, attr, copy = {};
	for (i = 0; i < attrList.length; i += 1) {
		attr = attrList[i];
		if (orig[attr] === undefined) {
			throw {
				name: 'ParamError',
				message: 'missing param: ' + attr
			};
		}
		if (copy[attr] !== undefined) {
			throw {
				name: 'ParamError',
				message: 'extra param: ' + attr
			};
		}
		copy[attr] = orig[attr];
	}
	return copy;
};





/// Augments the jquery svg library
var changeableText = function(svg, parent, initial) {
	var
		textNode = svg.root().ownerDocument.createTextNode(initial),
		text = svg.root().ownerDocument.createElementNS("http://www.w3.org/2000/svg", "text");

	text.appendChild(textNode);
	parent.appendChild(text);

	return {
		text : text,
		change : function(value) {
			textNode.nodeValue = value;
		}
	}
}


var spinnerBase = function(svg, x, y, w, h, init, incFn, decFn, callback) {
	var
		g = svg.group(),
		r = svg.rect(g, x, y, w, h),
		up = svg.polygon(g, [[x + h * 0.05, y + h * 0.45], [x + h * 0.5, y + h * 0.05], [x + h * 0.95, y + h * 0.45]]),
		down = svg.polygon(g, [[x + h * 0.05, y + h * 0.55], [x + h * 0.5, y + h * 0.95], [x + h * 0.95, y + h * 0.55]]),
		val = init,
		text = changeableText(svg, g, val),
		change = function(evt, val, key) {
			evt.preventDefault();
			if (val === null) {
				svg.change(text.text, {fill: 'red'});
			} else {
				text.change(val);
				callback && callback(val);
			}
			svg.change(key, {fill: 'red'});
		},
		clear = function(evt) {
			svg.change(up, {fill: 'blue'});
			svg.change(down, {fill: 'blue'});
			svg.change(text.text, {fill: 'white'});
		};

		up.addEventListener("mousedown", function(evt){change(evt,incFn(), up);}, false);
		down.addEventListener("mousedown", function(evt){change(evt,decFn(), down);}, false);
		up.addEventListener("mouseup", clear, false);
		down.addEventListener("mouseup", clear, false);
		up.addEventListener("mouseout", clear, false);
		down.addEventListener("mouseout", clear, false);

		clear();

		svg.change(text.text, {x: x + h * 1.1, y: y + h * 0.8, fill: 'white', fontFamily: 'Verdana', fontSize: h * 0.8, /* textLength: w - (h * 1.2)/*, textAnchor: 'spacingAndGlyphs'*/});

}

var numSpinner = function(svg, x, y, w, h, min, max, step, initial, callback) {
	var
		val = initial,
		inc = function() {
			var newVal = val + step;
			if (newVal > max) {
				return null;
			}
			val = newVal;
			return val;
		},
		dec = function() {
			var newVal = val - step;
			if (newVal < min) {
				return null;
			}
			val = newVal;
			return val;
		},
		base = spinnerBase(svg, x, y, w, h, val, inc, dec, callback);
	return {
		value : function() {
			return val;
		}
	}
}

var listSpinner = function(svg, x, y, w, h, vals, callback) {
	var
		i = 0,
		max = vals.length - 1,
		inc = function() {
			i = (i < max) ? (i + 1) : 0;
			return vals[i];
		},
		dec = function(val) {
			i = (i > 0) ? (i - 1) : max;
			return vals[i];
		},
		base = spinnerBase(svg, x, y, w, h, vals[0], inc, dec, callback);
	return {
		value : function() {
			return i;
		}
	}
}


var timerHeart = function(ticksPerSec) {
	var
		interval = 1000 / ticksPerSec,
		ticks = 0,
		ticker,
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

			ticks++;
			start = new Date().getTime();
			for (i=0; i<len; i++) {
				callbacks[i]();
			}
			procTime = new Date().getTime() - start;
			totProcTime += procTime;
			if (procTime > maxProcTime) {
				maxProcTime = procTime;
			}
		};

	return {
		addCallback: function(fn) {
			callbacks.push(fn);
		},
		start: function() {
			if (ticker) {
				throw {name: 'bad state', message: 'ticker already started'};
			}
			ticker = setInterval(tickTask, interval);
		},
		stop: function() {
			if (!ticker) {
				throw {name: 'bad state', message: 'ticker already stopped'};
			}
			clearInterval(ticker);
			ticker = null;
		},
		step: function() {
			if (ticker) {
				throw {name: 'bad state', message: 'ticker already running'};
			}
			tickTask();
		},
		getInfo: function() {
			return {
				running: ticker != null,
				elapsed: ticks / ticksPerSec,  // seconds
				maxLoad: maxProcTime / interval,  // 0 - 1
				aveLoad: ticks ? (totProcTime / (ticks * interval)) : 0  // 0 - 1
			}
		}
	};
}

// {
// 	showTime: function(ticks) {
// 		totalSecs = ticks / ticksPerSec;
// 		mins =
// 		secs = totalSecs % 60;
// 		string = mins + ':' + secs

var timerInterface = function(svg, x, y, h, heart)
{
	var
		g = svg.group({transform: "translate(" + x + "," + y + ")"}),
		fieldDisplays = [],

		step = svg.circle(g, h*0.7, h*0.15, h * 0.15, {fill: 'blue', stroke: 'black'}),
		control = svg.group(g),
		play = svg.polygon(control, [[h*0.1, h*0.1], [h*0.9, h*0.5], [h*0.1, h*0.9]], {fill: 'green', stroke: 'black'}),
		pause = svg.group(control, {fill: 'none', stroke: 'none'}),
		pad2 = function(val) {
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
		toggle = function() {
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
		update = function() {
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
				if (state[field] != newState[field]) {
					fieldDisplays[field].change(pad2(newState[field]));
				}
			}
			state = newState;
		};

	svg.rect(pause, h*0.1, h*0.15, h*0.8, h*0.3);
	svg.rect(pause, h*0.1, h*0.55, h*0.8, h*0.3);
	svg.circle(g, h*2.1, h*0.3, h * 0.05, {fill: 'grey'});
	svg.circle(g, h*2.1, h*0.7, h * 0.05, {fill: 'grey'});
	svg.circle(g, h*3.2, h*0.50, h * 0.05, {fill: 'grey'});

	for (field in state) {
		fieldDisplays[field] = changeableText(svg, g, pad2(state[field]));
	}
	svg.change(fieldDisplays['mins'].text, {x: h * 1.1, y: h * 0.8, fill: 'white', fontSize: h * 0.8});
	svg.change(fieldDisplays['secs'].text, {x: h * 2.2, y: h * 0.8, fill: 'white', fontSize: h * 0.8});
	svg.change(fieldDisplays['subs'].text, {x: h * 3.3, y: h * 0.8, fill: 'white', fontSize: h * 0.8});
	svg.change(fieldDisplays['aver'].text, {x: h * 4.4, y: h * 0.4, fill: 'white', fontSize: h * 0.4});
	svg.change(fieldDisplays['peak'].text, {x: h * 4.4, y: h * 0.8, fill: 'white', fontSize: h * 0.4});

	update();

	heart.addCallback(update);

	control.addEventListener("click", toggle, false);
	step.addEventListener("click", function(){heart.step()}, false);

	return g;
}



