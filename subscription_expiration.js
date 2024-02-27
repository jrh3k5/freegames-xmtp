import dotenv from "dotenv";
import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { SubscriptionsTableName } from "./dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";
import { ExpirationHandler } from "./subscriptions/expiration_handler.js.js";
import { schedule } from 'node-cron';
import { Network, Alchemy } from "alchemy-sdk";

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
const subscriptionsService = new DynamoDBSubscriptionService(dynamodbClient);
const expirationHandler = new ExpirationHandler(subscriptionsService);

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network[process.env.ALCHEMY_NETWORK_ID]
};

if (!settings.apiKey) {
    throw "An Alchemy API key must be provided";
}

if (!settings.network) {
    throw "An invalid Alchemy network ID has been specified";
}

const alchemy = new Alchemy(settings);
const cronPattern = process.env.SUBSCRIPTION_DEACTIVATION_CRON || "0 0 0 * * *";
schedule(cronPattern, async () => {
    const latestBlock = await alchemy.core.getBlockNumber();
    console.log(`Expiring all subscriptions at or before block ${latestBlock}`);
    await expirationHandler(latestBlock);
});