import { expect } from "chai";
import { Handler } from "../../../subscriptions/eth_send/handler.js";

describe("ETH Send Handler", () => {
    let subscriptions;
    let sentMessages;
    let handler;

    beforeEach(() => {
        subscriptions = [];
        sentMessages = [];

        const minimumWei = 4000;
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

    describe("the allowlist has at least one entry", () => {
        let allowListedAddress;

        beforeEach(() => {
            allowListedAddress = "0xallowed";
            const allowList = [allowListedAddress];
            handler.allowList = allowList;
        })

        describe("the sender address is in the allowlist", () => {
            it("subscribes the address", async () => {
                await handler.handle(allowListedAddress, 123456, 4000);
                expect(subscriptions).to.have.lengthOf(1);
                expect(subscriptions[0].address).to.equal(allowListedAddress);
            })
        })

        describe("the sender address is not in the allowlist", () => {
            it("does not subscribe the address", async () => {
                await handler.handle("0xnotallowed", 123456, 4000);
                expect(subscriptions).to.be.empty;
            })
        })
    })
})