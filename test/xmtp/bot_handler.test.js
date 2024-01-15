import { expect } from "chai";
import { NewBotHandler } from "../../xmtp/bot_handler.js";

describe("Bot Handler", () => {
    let subscribedAddresses; // the addresses that are subscribed
    let sentMessages; // the messages sent to the user

    let handler;
    let xmtpContext;

    beforeEach(() => {
        subscribedAddresses = [];
        sentMessages = [];

        const subscriptionsService = {};
        subscriptionsService.isSubscribed = recipientAddress => {
            return Promise.resolve(subscribedAddresses.indexOf(recipientAddress) >= 0);
        };
        subscriptionsService.unsubscribe = recipientAddress => {
            const addressIndex = subscribedAddresses.indexOf(recipientAddress);
            if (addressIndex >= 0) {
                subscribedAddresses.splice(addressIndex, 1);
            }

            return Promise.resolve();
        };
        subscriptionsService.upsertSubscription = recipientAddress => {
            const addressIndex = subscribedAddresses.indexOf(recipientAddress);
            if (addressIndex < 0) {
                subscribedAddresses.push(recipientAddress);
            }

            return Promise.resolve();
        };

        xmtpContext = {
            message: {
                content: ""
            }
        };
        xmtpContext.reply = message => {
            sentMessages.push(message);
            return Promise.resolve();
        }

        handler = NewBotHandler(subscriptionsService);
    })

    describe("the sender is subscribed", () => {
        let recipientAddress;

        beforeEach(() => {
            recipientAddress = "sender.is.subscribed";
            xmtpContext.message.senderAddress = recipientAddress;
            subscribedAddresses.push(recipientAddress);
        })

        describe("the message is 'stop'", () => {
            beforeEach(() => {
                xmtpContext.message.content = "stop";
            })

            it("unsubscribes the sender", async () => {
                await handler(xmtpContext);

                expect(subscribedAddresses).to.not.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("You have been unsubscribed");
            })
        })

        describe("the message is not recogniezd", () => {
            beforeEach(() => {
                xmtpContext.message.content = "this message is not handled";
            })

            it("tells the user that the bot doesn't understand", async () => {
                await handler(xmtpContext);

                // the sender should not have been unsubscribed
                expect(subscribedAddresses).to.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("Sorry, I don't understand");
            })
        })
    })

    describe("the sender is not subscribed", () => {
        let recipientAddress;

        beforeEach(() => {
            recipientAddress = "sender.not.subscribed";
            xmtpContext.message.senderAddress = recipientAddress;
        })

        describe("the user sends 'stop'", () => {
            beforeEach(() => {
                xmtpContext.message.content = "stop";
            })

            it("tells the user they can't unsubscribe because they aren't subscribed", async () => {
                await handler(xmtpContext);

                // The user should not be subscribed
                expect(subscribedAddresses).to.not.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("you aren't subscribed");
            })
        })

        describe("the user sends 'subscribe", () => {
            beforeEach(() => {
                xmtpContext.message.content = "subscribe";
            })

            it("subscribes the user", async () => {
                await handler(xmtpContext);

                expect(subscribedAddresses).to.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("You are now subscribed");
            })
        })

        describe("the user input is not recognized", () => {
            beforeEach(() => {
                xmtpContext.message.content = "not recognized";
            })

            it("sends the initial salutation to the user", async () => {
                await handler(xmtpContext);

                // the user should not be subscribed
                expect(subscribedAddresses).to.not.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("Welcome to the free games bot!");
            })
        })
    })
})