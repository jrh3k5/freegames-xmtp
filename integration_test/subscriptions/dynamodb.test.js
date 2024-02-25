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
            let page = await subscriptionsRepo.getSubscriptions();
            do {
                if (!page) {
                    break
                }

                page.recipientAddresses.forEach(receipientAddress => {
                    returnedAddresses.push(receipientAddress);
                })

                page = await subscriptionsRepo.getSubscriptions(page.cursor);
            } while(page.recipientAddresses.length && page.cursor)

            expect(returnedAddresses).to.have.lengthOf(99);
            expect(returnedAddresses).to.not.contain(deactivatedAddress);
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