# Grayconsole

Grayconsole is a browser and nodejs compatible library which intercepts calls to `console.<level>` and sends them to Graylog using GELF over HTTP(S).

## Features

 - details of the platform (retrieved using [platform.js](https://github.com/bestiejs/platform.js/)) are automatically added to each message sent to Graylog
 - only messages of the specified level or above are sent to Graylog
 - Errors are automatically serialized along with their message and stack trace

## Usage

Call the `configure` function in the `grayconsole` package during the startup phase of your
application/page to start logging to Graylog.  The example below will log all calls of level
`info` or above (i.e. `console.info(...)`, `console.warn(...)` and `console.error(...)`) to
Graylog.  The static fields `version` and `is_cordova` will be attached to every call with the
given values.

```ts
import { configure as configureGrayconsole } from "grayconsole";

configureGrayconsole({
  endpoint: "https://mygraylogserver:12201/gelf",
  host: "myproductname",
  level: "info",
  staticProperties: {
    version: "1.5",
    is_cordova: true
  }
});
```

If the first argument of the call to `console.<level>` is a string then this is the `message` logged to Graylog.  All following arguments are objects which are combined into a single object and sent to Graylog as fields.

```ts
console.info("I am a message");
console.info("User logged in", { name: "Dave" });
console.ingo("Can't find file", { filename: "missing.json" }, someRelevantObject, someOtherRelevantObject)
```
