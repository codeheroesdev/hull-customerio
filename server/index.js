/* @flow */
import Hull from "hull";
import express from "express";
import Bottleneck from "bottleneck";

import Server from "./server";

const {
  LOG_LEVEL,
  SECRET,
  PORT,
  OVERRIDE_FIREHOSE_URL,
} = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

const options = {
  hostSecret: SECRET || "1234",
  port: PORT || 8082,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

let app = express();

const connector = new Hull.Connector(options);

connector.setupApp(app);

const bottleneck = new Bottleneck(30, 34);

app = Server(app, bottleneck);
connector.startApp(app);