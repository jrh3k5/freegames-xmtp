import { expect } from "chai";
import { newUserNotificationHandler } from "../../queue/user_notification.js";

describe("User Notification Handler", () => {
    let gameNotificationsByAddress;
    let notifier;
    let handler;

    beforeEach(() => {
        gameNotificationsByAddress = {};

        notifier = {};
        notifier.notify = (recipientAddress, gameDetails) => {
            if (!gameNotificationsByAddress[recipientAddress]) {
                gameNotificationsByAddress[recipientAddress] = [];
            }

            gameNotificationsByAddress[recipientAddress].push(gameDetails);

            return Promise.resolve();
        };

        handler = newUserNotificationHandler(notifier);
    })

    it("passes the game details along to the notifier", async () => {
        const gameID = "12345";
        const gameTitle = "This is a title";
        const gameDescription = "This is a game description";
        const storeURL = "http://this.is.a.store.url/";

        const recipientAddress = "address.recipient";

        const message = {
            MessageAttributes: {
                GameID: {
                    StringValue: gameID
                },
                RecipientAddress: {
                    StringValue: recipientAddress
                },
                GameTitle: {
                    StringValue: gameTitle
                },
                GameDescription: {
                    StringValue: gameDescription
                },
                StoreURL: {
                    StringValue: storeURL
                }
            }
        };

        await handler(message);

        expect(gameNotificationsByAddress[recipientAddress]).to.have.lengthOf(1);

        const capturedDetails = gameNotificationsByAddress[recipientAddress][0];
        expect(capturedDetails.gameID).to.equal(gameID);
        expect(capturedDetails.gameTitle).to.equal(gameTitle);
        expect(capturedDetails.gameDescription).to.equal(gameDescription);
        expect(capturedDetails.url).to.equal(storeURL);
    })

    describe("the kill switch is enabled", () => {
        it("does not pass along the message", async () => {
            const killSwitched = newUserNotificationHandler(notifier, true);
            const recipientAddress = "address.recipient.killswitched";
    
            const message = {
                MessageAttributes: {
                    RecipientAddress: {
                        StringValue: recipientAddress
                    },
                }
            };

            await killSwitched({});
            expect(gameNotificationsByAddress[recipientAddress]).to.not.exist;
        })
    })
})