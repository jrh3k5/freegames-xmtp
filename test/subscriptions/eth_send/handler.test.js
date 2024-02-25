import { expect } from "chai";
import { Handler } from "../../../subscriptions/eth_send/handler.js";

describe("ETH Send Handler", () => {
    let subscribedUsers;
    let handler;

    beforeEach(() => {
        subscribedUsers = [];

        const minimumGwei = 4000;
        const subscriptionDurationBlocks = 60;

        const subscriptionService = {};
        subscriptionService.upsertSubscription = async (address) => {
            subscribedUsers.push(address);
        };

        handler = new Handler(subscriptionService, subscriptionDurationBlocks, minimumGwei);
    })

    describe("when the given gwei is less than the minimum amount", () => {
        it("does nothing", async() => {
            await handler.handle("0x1234", 3999);

            expect(subscribedUsers).to.be.empty;
        })
    })

    describe("when the given gwei is at least the minimum", () => {
        it("subscribes the user", async() => {
            const senderAddress = "0xbB5DA99Ae1726681d4369926EC47fAcc15283A28";
            
            await handler.handle(senderAddress, 4000);

            expect(subscribedUsers).to.contain(senderAddress);
        })
    })
})