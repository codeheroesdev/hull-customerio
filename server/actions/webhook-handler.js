/* @flow */
import { Request, Response } from "express";
import _ from "lodash";

import eventsMapping from "../mappings/events-mapping";

export default function webhookHandler(req: Request, res: Response) {
  res.send();
  const { data: { email_address, customer_id, campaign_id, template_id, subject }, event_type, timestamp, event_id } = req.body;

  const eventName = _.get(eventsMapping, event_type);
  if (!eventName) {
    return Promise.resolve();
  }

  const user = {
    email: email_address
  };

  const asUser = req.hull.client.asUser({ email: user.email });

  const eventPayload = { user, template_id, subject, customer_id, campaign_id };

  const context = {
    event_id,
    created_at: timestamp
  };

  return asUser.track(eventName, eventPayload, context).then(() => req.hull.metric.increment("ship.incoming.events", 1));
}
