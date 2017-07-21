/* global describe, it, beforeEach, afterEach */

import Minihull from "minihull";
import assert from "assert";
import axios from "axios";
import bootstrap from "./support/bootstrap";
import jwt from "jwt-simple";

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  const private_settings = {
    synchronized_segments: ["hullSegmentId"],
    anonymous_events: "sure, why not",
    hull_user_id_mapping: "test_id",
    customerio_site_id: "1",
    customerio_api_key: "2",
    sync_fields_to_customerio: [{ hull: "first_name", name: "firstName" }, { hull: "last_name", name: "lastName" }],
    events_filter: ["Page Event", "Custom Event", "Anonymous Event"]
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);

    minihull.stubConnector({
      id: "123456789012345678901234", private_settings
    });

    minihull.stubSegments([
      {
        name: "testSegment",
        id: "hullSegmentId"
      }
    ]);

    setTimeout(() => {
      done();
    }, 1000);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });

  const config = {
    organization: "localhost:8001",
    ship: "123456789012345678901234",
    secret: "1234"
  };
  const token = jwt.encode(config, "1234");

  it("should track email events in correct form", (done) => {
    axios.post(`http://localhost:8000/webhooks?token=${token}`, { data:
      { campaign_id: "1",
        customer_id: "example_customer",
        email_address: "example@customer.io",
        email_id: "example_email",
        subject: "Example Email",
        template_id: "2" },
      event_id: "abc123",
      event_type: "email_sent",
      timestamp: 1500635446 }
    );

    minihull.on("incoming.request", (req) => {
      const batch = req.body.batch;
      if (batch) {
        const { type, body } = batch[0];

        assert.equal(type, "track");
        assert.equal(body.properties.campaign_id, "1");
        assert.equal(body.properties.customer_id, "example_customer");
        assert.equal(body.properties.subject, "Example Email");
        assert.equal(body.properties.template_id, "2");
        assert.equal(body.properties.user.email, "example@customer.io");
        assert.equal(body.event_id, "abc123");
        assert.equal(body.created_at, 1500635446);
        assert.equal(body.event, "Email Sent");

        done();
      }
    });
  });

  it("should not track events if event_type is undefined on our side", (done) => {
    axios.post(`http://localhost:8000/webhooks?token=${token}`, { data:
      { campaign_id: "1",
        customer_id: "example_customer",
        email_address: "example@customer.io",
        email_id: "example_email",
        subject: "Example Email",
        template_id: "2" },
      event_id: "abc123",
      event_type: "email_that_we_did_not_specified",
      timestamp: 1500635446 }
    );

    minihull.on("incoming.request", (req) => {
      const batch = req.body.batch;
      if (batch) {
        done("track events should not happen !");
      }
    });

    setTimeout(() => {
      done();
    }, 1500);
  });
});
