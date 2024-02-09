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
  let notifiedDefaultOnly;

  beforeEach(() => {
    gameDetailsByID = {};
    webhookSecret = "shhhhh";
    notifiedGameDetails = [];
    notifiedDefaultOnly = [];

    notifier = {};
    notifier.notify = (gameDetails, notifyDefaultOnly) => {
      notifiedGameDetails.push(gameDetails);
      notifiedDefaultOnly.push(notifyDefaultOnly);
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
  })

  describe("the request has no body", () => {
    it("rejects the request", async () => {
      await webhookHandler({}, response);
      expect(response.statusCode).to.equal(400);
      expect(response.responseBody).to.equal("No request body supplied");
      expect(response.ended).to.be.true;
    })
  })

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
    })

    describe("for a 'free_games' event", () => {
      beforeEach(() => {
        requestBody.event = "free_games";
      })

      it("sends out a notification of the free game", async () => {
        const gameID = 12345;
        const gameDetails = new GameDetails(`${gameID}`, "A Free Game", "Free is best", "https://free.game/", 59.99, "gog", 0.00);
        gameDetailsByID[gameID] = gameDetails;
        requestBody.data = [gameID];

        await webhookHandler(request, response);

        expect(notifiedGameDetails).to.contain(gameDetails);
      })

      describe("there are no game IDs in the request", () => {
        it("silently drops the request", async () => {
          await webhookHandler(request, response);
          expect(response.statusCode).to.equal(200);
          expect(response.ended).to.be.true.to.equal(true);

          expect(notifiedGameDetails).to.be.empty;
        })
      })

      describe("the current price is not free", () => {
        it("silently drops the request", async () => {
            const gameID = 12345;
            const gameDetails = new GameDetails(`${gameID}`, "A Not-Free Game", "Free is best", "https://not.free.game/", 49.99, "steam", 19.99);
            gameDetailsByID[gameID] = gameDetails;
            requestBody.data = [gameID];

            await webhookHandler(request, response);

            expect(notifiedGameDetails).to.be.empty;
        })
      })

      describe("the request is to only notify default recipients", () => {
        beforeEach(() => {
            requestBody.notifyDefaultRecipientsOnly = true;
        })

        it("generates a request to only notify the default recipients", async () => {
            const gameID = 12345;
            const gameDetails = new GameDetails(`${gameID}`, "A Free Game for Default Notifications Only", "Free is best", "https://free.game/")
            gameDetailsByID[gameID] = gameDetails;
            requestBody.data = [gameID];

            await webhookHandler(request, response);

            expect(notifiedGameDetails).to.contain(gameDetails);
            expect(notifiedDefaultOnly[0]).to.be.true;
        })
      })
    })

    describe("the webhook secret is incorrect", () => {
      it("rejects the request", async () => {
        requestBody.secret = "oopsies";

        await webhookHandler(request, response);

        expect(response.statusCode).to.equal(401);
        expect(response.ended).to.be.true;
      })
    })

    describe("the event is not for free games", () => {
      it("quietly drops the request", async () => {
        requestBody.event = "not_free_games";

        await webhookHandler(request, response);

        expect(response.statusCode).to.equal(200);
        expect(response.ended).to.be.true;
      })
    })

    describe("the webhook kill switch is enabed", () => {
      it("silently drops the request", async () => {
        const killSwitched = NewWebhookHandler(webhookSecret, freestuffClient, notifier, true);
  
        const gameID = 98765;
        const gameDetails = new GameDetails(`${gameID}`, "No One Will Know About This", "It Is Kill-Switched", "https://kill.switch/", 29.99, "gog", 0.00);
        gameDetailsByID[gameID] = gameDetails;
        requestBody.event = "free_games";
        requestBody.data = [gameID];
  
        await killSwitched(request, response);
  
        // no notifications should have gone out
        expect(notifiedGameDetails).to.not.contain(gameDetails);
      })
    })
  })
})