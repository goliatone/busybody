'use strict';
const Keypath = require('gkeypath');

function _isPlainObject(o) {
    return typeof o === 'object';
}

function _isString(s){
    return typeof s === 'string';
}

function _isFunction(f){
    return typeof f === 'function';
}

function _isNumber(n){
    return typeof n === 'number';
}

function _last(a){
    return a[a.length - 1];
}

function _isArray(a){
    return Array.isArray(a);
}

function _get(o, keypath, def) {
    return Keypath.get(o, keypath, def);
}

function _has(o, prop){
    return o[prop] !== undefined;
}


module.exports._has = _has;
module.exports._get = _get;
module.exports._last = _last;
module.exports._isArray = _isArray;
module.exports._isNumber = _isNumber;
module.exports._isFunction = _isFunction;
module.exports._isObject = _isPlainObject;
module.exports._isString = _isString;
