import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
import { SubscriptionsTableName } from "./dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";
import run from "@xmtp/bot-starter"

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

// Load the default recipients
let defaultRecipients = [];
if (process.env.XMTP_BOT_DEFAULT_RECIPIENTS) {
    defaultRecipients = process.env.XMTP_BOT_DEFAULT_RECIPIENTS.split(",");
}

console.log(`Seeding ${defaultRecipients.length} default recipients`);

for (let i = 0; i < defaultRecipients.length; i++) {
    await subscriptionsService.upsertSubscription(defaultRecipients[i]);
}

// XMTP
run(async (context) => {
    const messageBody = context.message.content;
    await context.reply(`ECHO: ${messageBody}`);
});
