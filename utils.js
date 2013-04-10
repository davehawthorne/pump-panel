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






