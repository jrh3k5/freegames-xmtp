import { expect } from "chai";
import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { SubscriptionsTableName } from "../../dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "../../subscriptions/dynamodb.js";

describe("DynamoDB integration test", () => {
    let subscriptionsRepo;

    beforeEach(() => {
        const awsRegion = "us-east-1";
        const awsEndpointURL = "http://localstack:4566";

        const awsConfig = {
            endpoint: awsEndpointURL,
            region: awsRegion
        };
        const dynamodbClient = new DynamoDBClient(awsConfig);

        subscriptionsRepo = new DynamoDBSubscriptionService(dynamodbClient);
    })

    describe("upserting a subscription", () => [
        describe("the subscription does not already exist", () => {
            it("creates a subscription", async () => {
                const address = "0xDoesNotExistAlready";
                // Avoid false positives
                expect(await subscriptionsRepo.isSubscribed(address)).to.be.false;

                await subscriptionsRepo.upsertSubscription(address);

                expect(await subscriptionsRepo.isSubscribed(address)).to.be.true;
            })
        })
    ])
})