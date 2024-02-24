import { expect } from "chai";
import { newBotHandler } from "../../xmtp/bot_handler.js";

describe("Bot Handler", () => {
    let subscribedAddresses; // the addresses that are subscribed
    let sentMessages; // the messages sent to the user

    let handler;
    let allowList;
    let xmtpMessage;

    beforeEach(() => {
        allowList = [];
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

        xmtpMessage = {
            content: "",
            conversation: {}
        }

        xmtpMessage.conversation.send = async (message) => {
            sentMessages.push(message);
        };

        handler = newBotHandler(subscriptionsService, allowList);
    })

    describe("the sender is subscribed", () => {
        let botAddress;
        let recipientAddress;

        beforeEach(() => {
            botAddress = "bot.address";
            xmtpMessage.recipientAddress = botAddress;

            recipientAddress = "sender.is.subscribed";
            xmtpMessage.senderAddress = recipientAddress;
            
            subscribedAddresses.push(recipientAddress);
        })

        describe("the message is 'stop'", () => {
            beforeEach(() => {
                xmtpMessage.content = "stop";
            })

            it("unsubscribes the sender", async () => {
                await handler(xmtpMessage);

                expect(subscribedAddresses).to.not.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("You have been unsubscribed");
            })
        })

        describe("the message is 'help'", () => {
            beforeEach(() => {
                xmtpMessage.content = "help";
            })

            it("tells the user where they can submit a bug", async () => {
                await handler(xmtpMessage);

                // the sender should not have been unsubscribed
                expect(subscribedAddresses).to.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("https://github.com/jrh3k5/freegames-xmtp/issues");
            })
        })

        describe("the message is not recognized", () => {
            beforeEach(() => {
                xmtpMessage.content = "this message is not handled";
            })

            it("does not respond to the user", async () => {
                await handler(xmtpMessage);

                // the sender should not have been unsubscribed
                expect(subscribedAddresses).to.contain(recipientAddress);
                expect(sentMessages).to.be.empty;
            })
        })
    })

    describe("the sender is not subscribed", () => {
        let recipientAddress;

        beforeEach(() => {
            recipientAddress = "sender.not.subscribed";
            
            allowList.push(recipientAddress);

            xmtpMessage.senderAddress = recipientAddress;
        })

        describe("the user sends 'stop'", () => {
            beforeEach(() => {
                xmtpMessage.content = "stop";
            })

            it("tells the user they can't unsubscribe because they aren't subscribed", async () => {
                await handler(xmtpMessage);

                // The user should not be subscribed
                expect(subscribedAddresses).to.not.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("you aren't subscribed");
            })
        })

        describe("the user sends 'subscribe", () => {
            beforeEach(() => {
                xmtpMessage.content = "subscribe";
            })

            it("subscribes the user", async () => {
                await handler(xmtpMessage);

                expect(subscribedAddresses).to.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("You are now subscribed");
            })
            
            describe("the sender is not in the allowlist", () => {
                beforeEach(() => {
                    xmtpMessage.senderAddress = "0xnotallowed";
                })

                it("denies the subscription request", async () => {
                    await handler(xmtpMessage);

                    expect(subscribedAddresses).to.not.contain(xmtpMessage.senderAddress);
                    // protect against false positives due to bad setup
                    expect(subscribedAddresses).to.not.contain(recipientAddress);
                })
            })
        })

        describe("the user input is not recognized", () => {
            beforeEach(() => {
                xmtpMessage.content = "not recognized";
            })

            it("sends the initial salutation to the user", async () => {
                await handler(xmtpMessage);

                // the user should not be subscribed
                expect(subscribedAddresses).to.not.contain(recipientAddress);
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.contain("Welcome to the free games bot!");
            })
        })
    })
})