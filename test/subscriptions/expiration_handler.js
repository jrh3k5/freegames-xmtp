import { expect } from "chai";
import { ExpirationHandler } from "../../subscriptions/expiration_handler.js";

describe("ExpirationHandler", () => {
    let subscriptions;
    let sentMessages;
    let handler;

    beforeEach(() => {
        subscriptions = [];
        sentMessages = {};

        const subscriptionService = {};
        subscriptionService.getSubscriptionAddresses = async (options) => {
            const expiryThreshold = options.expiryThreshold;
            if (!expiryThreshold) {
                throw "No expiry threshold provided";
            }

            const matchingAddresses = subscriptions.filter(s => s.expiryThreshold <= expiryThreshold)
                .map(m => m.address);

            return {
                recipientAddresses: matchingAddresses
            }
        }
        subscriptionService.unsubscribe = async (address) => {
            subscriptions.filter(s => s.address === address).forEach(s => s.active = false);
        }
        
        const xmtpClient = {};
        xmtpClient.conversations = {};
        xmtpClient.conversations.newConversation = async (address) => {
            if (!sentMessages[address]) {
                sentMessages[address] = [];
            }

            const conversation = {};
            conversation.send = async (message) => {
                sentMessages[address].push(message);
            }
            return conversation;
        }

        handler = new ExpirationHandler(subscriptionService, xmtpClient, 400000000000000, "subscribe.test.unit");
    })

    describe("deactivateExpiredSubscriptions", () => {
        it("expires the address whose subscription has expired", async () => {
            const subscription = {
                address: "0xtoexpire",
                expiryThreshold: 2
            }
            subscriptions.push(subscription);

            await handler.deactivateExpiredSubscriptions(2);

            expect(subscription.active).to.be.false;

            expect(sentMessages[subscription.address]).to.have.lengthOf(1);
            // Make sure that the amount is properly formatted
            expect(sentMessages[subscription.address][0]).to.contain("You can send 0.0004 ETH to subscribe.test.unit");
        })
    })
})