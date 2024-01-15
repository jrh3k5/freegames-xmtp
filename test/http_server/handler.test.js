import { expect } from "chai";
import { NewWebhookHandler } from "../../http_server/handler.js";
import { GameDetails } from "../../freestuff/model.js"

describe("Freestuff Webhook Handler", () => { 
  let webhookHandler;
  let webhookSecret;
  let response;
  let freestuffClient;
  let gameDetailsByID;
  let notifier;
  let notifiedGameDetails;

  beforeEach(() => {
    gameDetailsByID = {};
    webhookSecret = "shhhhh";
    notifiedGameDetails = []

    notifier = {};
    notifier.notify = gameDetails => {
      notifiedGameDetails.push(gameDetails);
      return Promise.resolve();
    };

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

    freestuffClient = {};
    freestuffClient.getGameDetails = gameID => {
      return Promise.resolve(gameDetailsByID[gameID]);
    }

    webhookHandler = NewWebhookHandler(webhookSecret, freestuffClient, notifier);
  });

  describe("the request has no body", () => {
    it("rejects the request", async () => {
      await webhookHandler({}, response);
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

      it("sends out a notification of the free game", async () => {
        const gameID = 12345;
        const gameDetails = new GameDetails(`${gameID}`, "A Free Game", "Free is best", "https://free.game/")
        gameDetailsByID[gameID] = gameDetails;
        requestBody.data = [gameID];

        await webhookHandler(request, response);

        expect(notifiedGameDetails).to.contain(gameDetails);
      });

      describe("there are no game IDs in the request", () => {
        it("silently drops the request", async () => {
          await webhookHandler(request, response);
          expect(response.statusCode).to.equal(200);
          expect(response.ended).to.be.true.to.equal(true);;
        })
      });
    });

    describe("the webhook secret is incorrect", () => {
      it("rejects the request", async () => {
        requestBody.secret = "oopsies";

        await webhookHandler(request, response);

        expect(response.statusCode).to.equal(401);
        expect(response.ended).to.be.true;
      });
    });

    describe("the event is not for free games", () => {
      it("quietly drops the request", async () => {
        requestBody.event = "not_free_games";

        await webhookHandler(request, response);

        expect(response.statusCode).to.equal(200);
        expect(response.ended).to.be.true;
      });
    });
  });
});