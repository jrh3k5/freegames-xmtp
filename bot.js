import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
import { SubscriptionsTableName } from "./dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";
import run from "@xmtp/bot-starter"
import { NewBotHandler } from "./xmtp/bot_handler.js";
import { CachingSubscriptionService } from "./subscriptions/caching.js";
import { newCache } from "./cache/cache.js";
import { getDefaultRecipients } from "./xmtp/notify/recipients.js";

dotenv.config();

const awsConfig = {
    endpoint: process.env.AWS_ENDPOINT,
    region: process.env.AWS_REGION
};
const dynamodbClient = new DynamoDBClient(awsConfig);

console.log("Waiting for subscriptions table presence");

// Wait for the table to exist
const results = await waitUntilTableExists({client: dynamodbClient, maxWaitTime: 30}, {TableName: SubscriptionsTableName})
if (results.state !== 'SUCCESS') {
    throw `Subscriptions table did not exist in sufficient time; result state was '${results.state}'`;
}
const dynamoDBSubscriptionsService = new DynamoDBSubscriptionService(dynamodbClient);
const cache = newCache();
const cachingSubscriptionsService = new CachingSubscriptionService(dynamoDBSubscriptionsService, cache);

// Load the default recipients
const defaultRecipients = getDefaultRecipients();

console.log(`Seeding ${defaultRecipients.length} default recipients`);

for (let i = 0; i < defaultRecipients.length; i++) {
    await cachingSubscriptionsService.upsertSubscription(defaultRecipients[i]);
}

const botHandler = NewBotHandler(cachingSubscriptionsService);

// XMTP
run(botHandler);
