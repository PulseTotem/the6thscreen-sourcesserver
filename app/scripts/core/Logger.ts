/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 */

/// <reference path="../../../libsdef/colors.d.ts" />

var colors = require('colors');

/**
 * Represents a logger with a coloration option.
 *
 * @class Logger
 */
class Logger {

    /**
     * Status of color mode.
     *
     * @property color
     * @type boolean
     * @static
     * @default true
     */
    static color : boolean = true;

    /**
     * Change the color status.
     *
     * @method useColor
     * @static
     * @param {boolean} status - The new status.
     */
    static useColor(status : boolean) {
        Logger.color = status;
    }

    /**
     * Log message as Debug Level.
     *
     * @method debug
     * @static
     * @param {string} msg - The message to log.
     */
    static debug(msg) {
        if(Logger.color) {
            console.log(msg.green);
        } else {
            console.log(msg);
        }
    }

    /**
     * Log message as Info Level.
     *
     * @method info
     * @static
     * @param {string} msg - The message to log.
     */
    static info(msg) {
        if(Logger.color) {
            console.log(msg.blue);
        } else {
            console.log(msg);
        }
    }

    /**
     * Log message as Warn Level.
     *
     * @method warn
     * @static
     * @param {string} msg - The message to log.
     */
    static warn(msg) {
        if(Logger.color) {
            console.log(msg.orange);
        } else {
            console.log(msg);
        }
    }

    /**
     * Log message as Error Level.
     *
     * @method error
     * @static
     * @param {string} msg - The message to log.
     */
    static error(msg) {
        if(Logger.color) {
            console.log(msg.red);
        } else {
            console.log(msg);
        }
    }

}