import "mocha";
import { assert } from "chai";
import { configure } from "../src";

describe("A connection", () => {
  // beforeEach(async () => {
  // });

  it("should cope with graylog failure", (done) => {
    configure({
      endpoint: "http://localhost:5000",
      host: "graylogtest",
      level: "log"
    });

    console.error("Error!");
  }).timeout(999999999);

});

/*
(node:1151) UnhandledPromiseRejectionWarning: FetchError: request to https://logs.clarityenglish.com:12201/gelf failed, reason: connect ECONNREFUSED 52.59.83.89:12201
    at ClientRequest.<anonymous> (/home/ubuntu/.config/yarn/global/node_modules/isomorphic-fetch/node_modules/node-fetch/index.js:133:11)
    at emitOne (events.js:116:13)
    at ClientRequest.emit (events.js:211:7)
    at TLSSocket.socketErrorListener (_http_client.js:387:9)
    at emitOne (events.js:116:13)
    at TLSSocket.emit (events.js:211:7)
    at emitErrorNT (internal/streams/destroy.js:64:8)
    at _combinedTickCallback (internal/process/next_tick.js:138:11)
*/
