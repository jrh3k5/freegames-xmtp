import { expect } from "chai";
import { Handler } from "../../../subscriptions/eth_send/handler.js";

describe("ETH Send Handler", () => {
    let subscriptions;
    let sentMessages;
    let handler;

    beforeEach(() => {
        subscriptions = [];
        sentMessages = [];

        const minimumWwei = 4000;
        const subscriptionDurationBlocks = 60;

        const subscriptionService = {};
        subscriptionService.upsertSubscription = async (address, subscriptionExpiryBlock) => {
            subscriptions.push({
                address: address,
                subscriptionExpiryBlock: subscriptionExpiryBlock
            });
        };

        const xmtpClient = {};
        xmtpClient.conversations = {};
        xmtpClient.conversations.newConversation = async () => {
            const conversation = {};
            conversation.send = async message => {
                sentMessages.push(message);
            }
            return conversation;
        }

        handler = new Handler(subscriptionService, subscriptionDurationBlocks, minimumWei, xmtpClient);
    })

    describe("when the given gwei is less than the minimum amount", () => {
        it("does nothing", async() => {
            await handler.handle("0x1234", 12345, 3999);

            expect(subscriptions).to.be.empty;
        })
    })

    describe("when the given gwei is at least the minimum", () => {
        it("subscribes the user", async() => {
            const senderAddress = "0xbB5DA99Ae1726681d4369926EC47fAcc15283A28";
            const blockNumber = 489743;
            
            await handler.handle(senderAddress, blockNumber, 4000);

            expect(subscriptions).to.have.lengthOf(1);
            expect(subscriptions[0].address).to.equal(senderAddress);
            expect(subscriptions[0].subscriptionExpiryBlock).lessThanOrEqual(blockNumber + 60);

            // The user should have been sent a salutation message
            expect(sentMessages).to.not.be.empty;
        })
    })
})