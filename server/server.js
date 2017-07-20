/* @flow */
import express from "express";
import Bottleneck from "bottleneck";
import { notifHandler, batchHandler } from "hull/lib/utils";

import WebhookHandler from "./actions/webhook-handler";
import ApplyAgent from "./middlewares/apply-agent";
import * as actions from "./actions";

export default function Server(app: express, bottleneck: Bottleneck) {
  app.use(ApplyAgent(bottleneck));

  app.use("/batch", batchHandler(actions.batchHandler, {
    batchSize: 100,
    groupTraits: false
  }));

  app.use("/notify", notifHandler({
    userHandlerOptions: {
      groupTraits: false
    },
    handlers: {
      "user:update": actions.updateUser
    }
  }));

  app.use("/webhooks", WebhookHandler);

  app.get("/admin.html", (req, res) => {
    res.render("admin.html", {});
  });

  return app;
}