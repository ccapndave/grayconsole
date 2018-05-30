declare var global: any;
declare var require: Function;
require("isomorphic-fetch");

// The target will be window in a browser and global in node
const target = ((typeof window === "undefined") ? global : window);

// Make sure console.debug exists (it doesn't in node)
if (!target.console.debug) target.console.debug = target.console.log;

// Save the original console
const originalConsole = target.console;

// Get information about the platform
const platform = require("platform");

export interface Options {
  endpoint: string,
  host: string,
  level?: string,
  staticProperties?: any
}

interface LogFn {
  (message?: any, ...contexts: any[]): void;
}

function getLevel(level: string) {
  switch (level.toLowerCase()) {
    case "log": return 7;
    case "debug": return 7;
    case "info": return 6;
    case "notice": return 5;
    case "warn": return 4;
    case "error": return 3;
    case "critical": return 2;
    case "alert": return 1;
    case "emergency": return 0;
  }
}

export function configure(opts: Options) {
  const capitalize = s => s.length > 0 ? s[0].toUpperCase() + s.substring(1) : "";

  function makeLogger(originalFn: LogFn, level: string) {
    return (message: string | Error, ...contexts: any[]) => {
      // If the first element of contexts is a string then that is the fullMessage
      let fullMessage = null;
      if (contexts.length > 0 && typeof contexts[0] === "string") {
        fullMessage = contexts.shift();
      }

      // Put all the remaining contexts together into a single object
      const additionalFields = Object.assign({}, ...contexts);

      // Get the severity - this either comes from the console function, or from severity in the contexts
      const severity = additionalFields.severity !== undefined ? getLevel(additionalFields.severity) : getLevel(level);
      delete additionalFields.severity;

      // Only log to Graylog if the severity is at least opts.level
      if (severity <= getLevel(opts.level || "log")) {
        // If any of the additional fields are called 'id', rename them to 'id_' (since GELF reserves _id)
        if (Object.keys(additionalFields).filter(key => key === "id").length === 1) {
          additionalFields["id_"] = additionalFields.id;
          delete additionalFields.id;
        }

        // Construct the basic gelf message
        const gelfMessage: any = {
          "version": "1.1",
          "host": opts.host,
          "short_message": message,
          "level": severity,
        };

        // If message is an Error then extract useful bits
        if (Object.prototype.toString.call(message) === "[object Error]") {
          gelfMessage.short_message = (<Error>message).message;
          gelfMessage.full_message = (<any>message).stack;
        }

        // Add the full_message, if there is one
        if (fullMessage) gelfMessage.full_message = fullMessage;

        // Add all the information we got from platform.js
        gelfMessage.platform = { platform };

        // Plus the screen size details, if we can get them
        if (target.screen) {
          gelfMessage.platform.platform.screen = {
            availHeight: target.screen.availHeight,
            availLeft: target.screen.availLeft,
            availTop: target.screen.availTop,
            availWidth: target.screen.availWidth,
            colorDepth: target.screen.colorDepth,
            height: target.screen.height,
            pixelDepth: target.screen.pixelDepth,
            width: target.screen.width
          };

          // Explicitly check for orientation as it doesn't necessarily exist on Safari
          if (target.screen.orientation) {
            gelfMessage.platform.platform.screen.orientation = {
              angle: target.screen.orientation.angle,
              type: target.screen.orientation.type
            }
          }
        }

        // Add any static properties passed in at config time
        for (let key in (opts.staticProperties || {}))
          gelfMessage[`_${key}`] = opts.staticProperties[key];

        // Add all the optional parameters, with underscores
        for (let key in additionalFields)
          gelfMessage[`_${key}`] = additionalFields[key];

        // Create a headers object
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');

        // And finally make the request against the Graylog endpoint.  We don't care if it fails.
        fetch(opts.endpoint, {
          method: "post",
          body: JSON.stringify(gelfMessage),
          headers
        }).catch(_ => {});
      }

      // Write to the console
      originalFn.call(target.console, message + (fullMessage ? `: ${fullMessage}` : ""), ...contexts);
    }
  }

  // Overwrite the console methods with our wrapped versions (renaming the original)
  [ "log", "debug", "info", "warn", "error" ].forEach(level => {
    target.console[`original${capitalize(level)}`] = target.console[level];
    target.console[level] = makeLogger(originalConsole[level], level);
  });
}
