import dotenv from "dotenv";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { Handler } from "./subscriptions/eth_send/handler.js";
import { SubscriptionsTableName } from "./dynamodb/constants.js";
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";

dotenv.config();

const receiptAddress = (process.env.SUBSCRIPTION_RECEIPT_ADDRESS || "").toLowerCase();
if (!receiptAddress) {
    throw "A receipt address must be specified";
}

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

const blocksPerMinute = process.env.SUBSCRIPTION_NETWORK_BLOCKS_PER_MINUTE || 30;
const subscriptionDurationMinutes = process.env.SUBSCRIPTION_DURATION_MINUTES || (60 * 24 * 30);
const subscriptionDurationBlocks = blocksPerMinute * subscriptionDurationMinutes;

console.log(`New subscriptions will subscribe for ${subscriptionDurationMinutes} minutes; at ${blocksPerMinute} BPM, each subscription will last for ${subscriptionDurationBlocks} blocks`);

const minimumGwei = process.env.SUBSCRIPTION_MINIMUM_GWEI;
if (!minimumGwei) {
    throw "No gwei minimum specified";
}

console.log(`Subscribers must send at least ${minimumGwei} to subscribe`);

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

console.log(`Listening ETH sends to ${receiptAddress} on ${settings.network}`);

const sendHandler = new Handler(subscriptionsService, subscriptionDurationBlocks, minimumGwei);
new Alchemy(settings).ws.on(
    {
        method: AlchemySubscription.MINED_TRANSACTIONS,
        addresses: [{ to: receiptAddress }]
    },
    res => {
        try {
            const senderAddress = res.transaction.from;
            const sentGwei = parseInt(res.transaction.value, 16);
            sendHandler.handle(senderAddress, sentGwei).catch(e => {
                console.log(`Failed to handle send from ${senderAddress}`, e);
            });
        } catch(e) {
            console.log("failed to handle ETH send", e);
        }
    }
);