import { expect } from "chai";
import { NewWebhookHandler } from "../../http_server/handler.js";

describe("Freestuff Webhook Handler", () => { 
  let webhookHandler;
  let webhookSecret;
  let response;

  beforeEach(() => {
    webhookSecret = "shhhhh";

    response = {
      ended: false
    };
    
    response.status = statusCode => {
      response.statusCode = statusCode;
      return response;
    };

    response.send = responseBody => {
      response.responseBody = responseBody;
      return response;
    }

    response.end = () => {
      response.ended = true;
    };

    webhookHandler = NewWebhookHandler(webhookSecret);
  });

  describe("the request has no body", () => {
    it("rejects the request", () => {
      webhookHandler({}, response);
      expect(response.statusCode).to.equal(400);
      expect(response.responseBody).to.equal("No request body supplied");
      expect(response.ended).to.be.true;
    });
  });

  describe("the request has a body", () => {
    let request;
    let requestBody;

    beforeEach(() => {
      requestBody = {
        secret: webhookSecret
      };
      request = {
        body: requestBody
      };
    });

    describe("for a 'free_games' event", () => {
      beforeEach(() => {
        requestBody.event = "free_games";
      });

      describe("there are no game IDs in the request", () => {
        it("silently drops the request", () => {
          webhookHandler(request, response);
          expect(response.statusCode).to.equal(200);
          expect(response.ended).to.be.true.to.equal(true);;
        })
      });
    });

    describe("the webhook secret is incorrect", () => {
      it("rejects the request", () => {
        requestBody.secret = "oopsies";

        webhookHandler(request, response);
        expect(response.statusCode).to.equal(401);
        expect(response.ended).to.be.true;
      });
    });

    describe("the event is not for free games", () => {
      it("quietly drops the request", () => {
        requestBody.event = "not_free_games";

        webhookHandler(request, response);
        expect(response.statusCode).to.equal(200);
        expect(response.ended).to.be.true;
      });
    });
  });
});