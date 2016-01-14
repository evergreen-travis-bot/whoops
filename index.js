'use strict'

var forEach = require('lodash.foreach')
var captureStackTrace = require('capture-stack-trace')

function inherits (ctor, superCtor) {
  ctor.super_ = superCtor
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  })
}

var FACTORY = {
  OBJECT: function (error, fields) {
    forEach(fields, function (value, property) {
      error[property] = value
    })

    if (typeof error.message === 'function') error.message = error.message()
    if (error.code) error.message = error.code + ', ' + error.message

    return error
  },

  STRING: function (error, args) {
    var fn = {
      3: function () {
        error.name = args[0]
        error.code = args[1]
        error.message = error.code + ', ' + args[2]
        return error.message
      },
      2: function () {
        error.name = args[0]
        error.message = args[1]
        return error.message
      },
      1: function () {
        error.message = args[0]
        return error.message
      },
      0: function () {}
    }
    fn[args.length]()
    return error
  },

  STRING_NONAME: function (error, args) {
    var fn = {
      2: function () {
        error.code = args[0]
        error.message = error.code + ', ' + args[1]
        return error.message
      },
      1: function () {
        error.message = args[0]
        return error.message
      },
      0: function () {}
    }

    fn[args.length]()
    return error
  }
}

function Factory (ErrorType, factoryString) {
  return function (type) {
    var error = new ErrorType()
    if (typeof type === 'object') return FACTORY.OBJECT(error, type)
    return factoryString(error, arguments)
  }
}

module.exports = Factory(Error, FACTORY.STRING)

module.exports.create = function (className) {
  if (typeof className !== 'string') throw new TypeError('Expected className to be a string')
  if (/[^0-9a-zA-Z_$]/.test(className)) throw new Error('className contains invalid characters')

  var ErrorClass = eval('(function ' + className + '() { captureStackTrace(this, this.constructor); })')

  inherits(ErrorClass, Error)
  ErrorClass.prototype.name = className
  return Factory(ErrorClass, FACTORY.STRING_NONAME)
}
