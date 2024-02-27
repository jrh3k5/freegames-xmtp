import { expect } from "chai";
import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { SubscriptionsTableName } from "../../dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "../../subscriptions/dynamodb.js";

describe("DynamoDB integration test", () => {
    let subscriptionsRepo;

    beforeEach(() => {
        const awsRegion = "us-east-1";
        const awsEndpointURL = "http://localhost:4566";

        const awsConfig = {
            endpoint: awsEndpointURL,
            region: awsRegion 
        };
        const dynamodbClient = new DynamoDBClient(awsConfig);

        subscriptionsRepo = new DynamoDBSubscriptionService(dynamodbClient);
    })
    
    describe("getting subscriptions", () => {
        it("retrieves all of the active subscriptions", async () => {
            const addresses = [];
            for (let i = 0; i < 100; i++) {
                const address = `0xGetAllActive${i}`;
                addresses.push(address);
                await subscriptionsRepo.upsertSubscription(address);
            }

            // Deactivate one subscription to verify it's not returned
            const deactivatedAddress = addresses[49];
            await subscriptionsRepo.unsubscribe(deactivatedAddress);

            const returnedAddresses = [];
            let page = await subscriptionsRepo.getSubscriptionAddresses();
            do {
                if (!page) {
                    break
                }

                page.recipientAddresses.forEach(receipientAddress => {
                    returnedAddresses.push(receipientAddress);
                })

                page = await subscriptionsRepo.getSubscriptionAddresses({
                    cursor: page.cursor
                });
            } while(page.recipientAddresses.length && page.cursor)

            // Account for other tests' addresses showing up
            expect(returnedAddresses.length).to.be.greaterThanOrEqual(99);
            expect(returnedAddresses).to.not.contain(deactivatedAddress);
        })

        describe("with a subscription expiry block threshold", () => {
            it("gets the subscriptions that expired at or before the given block number", async () => {
                const expiryBlock = 36;
                const notExpiredAddress = "0xnotexpired";
                await subscriptionsRepo.upsertSubscription(notExpiredAddress, expiryBlock + 1);

                const expiredAddress = "0xexpired";
                await subscriptionsRepo.upsertSubscription(expiredAddress, expiryBlock - 1);

                const atThresholdAddress = "0xatthreshold";
                await subscriptionsRepo.upsertSubscription(atThresholdAddress, expiryBlock);

                const returnedAddresses = [];
                let page = await subscriptionsRepo.getSubscriptionAddresses({
                    expiryThreshold: expiryBlock
                });
                do {
                    if (!page) {
                        break
                    }
    
                    page.recipientAddresses.forEach(receipientAddress => {
                        returnedAddresses.push(receipientAddress);
                    })
    
                    page = await subscriptionsRepo.getSubscriptionAddresses({
                        cursor: page.cursor,
                        expiryThreshold: expiryBlock
                    });
                } while(page.recipientAddresses.length && page.cursor)

                expect(returnedAddresses).to.contain(expiredAddress);
                expect(returnedAddresses).to.contain(atThresholdAddress);
                expect(returnedAddresses).to.not.contain(notExpiredAddress);
            })
        })
    })

    describe("upserting a subscription", () => {
        describe("the subscription does not already exist", () => {
            it("creates a subscription", async () => {
                const address = "0xDoesNotExistAlready";
                // Avoid false positives
                expect(await subscriptionsRepo.isSubscribed(address)).to.be.false;

                await subscriptionsRepo.upsertSubscription(address);

                expect(await subscriptionsRepo.isSubscribed(address)).to.be.true;
            })
        })
    })
})