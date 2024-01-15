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

const unsubscribedSalutation = `Welcome to the free games bot! Message SUBSCRIBE to begin receiving notifications of free games!
\n
This is powered by freestuffbot.xyz, so the links you receive will be redirect.freestuffbot.xyz URLs.
\n
Message STOP at any time to stop receiving notifications.
`;

// XMTP
run(async (context) => {
    const recipientAddress = context.message.senderAddress;
    const isSubscribed = await subscriptionsService.isSubscribed(recipientAddress);
    if (isSubscribed) {
        switch (context.message.content.toLowerCase()) {
        case "stop":
            await subscriptionsService.unsubscribe(context.message.senderAddress);
            await context.reply("You have been unsubscribed from further notifications of free games.");
            break;
        default:
            await context.reply("Sorry, I don't understand. You can message STOP at any time to stop receiving notifications.");
        }
    } else {
        switch (context.message.content.toLowerCase()) {
        case "stop":
            await context.reply("You requested to stop receiving notifications, but you aren't subscribed. Message SUBSCRIBE to begin receiving notifications.");
            break;
        case "subscribe":
            await subscriptionsService.upsertSubscription(recipientAddress);
            await context.reply("You are now subscribed to receive notifications of free games. Look for messages from this account in your inbox!");
            break;
        default:
            await context.reply(unsubscribedSalutation);
        }
    }
});
