/**
 * Created by AlexanderC on 6/15/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {Log} from '../Log';

/**
 * Console native logging
 */
export class ConsoleDriver extends AbstractDriver {
  constructor() {
    super();

    this._console = ConsoleDriver._buildConsole();
  }

  /**
   * @returns {Object}
   * @private
   */
  static _buildConsole() {
    let nativeConsole = ConsoleDriver.nativeConsole;
    let console = {};

    for (let i in ConsoleDriver.METHODS_TO_OVERRIDE) {
      if (!ConsoleDriver.METHODS_TO_OVERRIDE.hasOwnProperty(i)) {
        continue;
      }

      let method = ConsoleDriver.METHODS_TO_OVERRIDE[i];

      // Fixes issue with node env
      if (method === 'debug' &&
        typeof nativeConsole[method] === 'undefined') {
        method = 'log';
      }

      console[method] = nativeConsole[method];
    }

    return console;
  }

  /**
   * @param {String} msg
   * @param {String} level
   * @param {*} context
   */
  log(msg, level, context) {
    let nativeMethod = 'log';

    switch (level) {
      case Log.EMERGENCY:
      case Log.ERROR:
      case Log.CRITICAL:
        nativeMethod = 'error';
        break;
      case Log.ALERT:
      case Log.WARNING:
        nativeMethod = 'warn';
        break;
      case Log.NOTICE:
        nativeMethod = 'log';
        break;
      case Log.INFO:
        nativeMethod = 'info';
        break;
      case Log.DEBUG:
        nativeMethod = 'debug';
        break;
    }

    // Fixes issue with node env
    (this._console[nativeMethod] || this._console.log)(AbstractDriver.timeString, msg);

    // @todo: figure out a better way of dumping context
    if (context) {
      // Fixes issue with node env
      (this._console.debug || this._console.log)('[DEBUG]', context);
    }
  }

  /**
   * @param {Boolean} logTime
   * @param {Boolean} coloredOutput
   * @param {Boolean} turnOff
   * @returns {ConsoleDriver}
   */
  overrideNative(logTime = true, coloredOutput = true, turnOff = false) {
    let nativeConsole = ConsoleDriver.nativeConsole;

    for (let i in ConsoleDriver.METHODS_TO_OVERRIDE) {
      if (!ConsoleDriver.METHODS_TO_OVERRIDE.hasOwnProperty(i)) {
        continue;
      }

      let method = ConsoleDriver.METHODS_TO_OVERRIDE[i];

      nativeConsole[method] = (...args) => {
        if (!turnOff) {
          let nativeArgs = args;

          if (logTime) {
            nativeArgs.unshift(AbstractDriver.timeString);
          }

          if (coloredOutput) {
            nativeArgs = ConsoleDriver._colorOutput(method, nativeArgs);
          }

          this._console[method](...nativeArgs);
        }
      };
    }

    return this;
  }

  /**
   * @param {String} type
   * @param {Array} args
   * @returns {Array}
   * @private
   */
  static _colorOutput(type, args) {
    let color = null;

    switch(type.toLowerCase()) {
      case 'error':
        color = 31; // red
        break;
      case 'warn':
        color = 33; // yellow
        break;
      default: color = 32; // green
    }

    args.unshift(`\x1b[${color}m`);
    args.push('\x1b[0m');

    return args;
  }

  /**
   * @returns {Object}
   */
  static get nativeConsole() {
    return typeof window === 'undefined' ? console : window.console;
  }

  /**
   * @returns {String[]}
   */
  static get METHODS_TO_OVERRIDE() {
    return ['error', 'log', 'warn', 'info', 'debug'];
  }
}
