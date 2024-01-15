import { DynamoDBClient, CreateTableCommand, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { buildWebhookServer } from "./http_server/index.js";
import { Client } from "@xmtp/xmtp-js";
import dotenv from "dotenv";
import { FreestuffClient } from "./freestuff/client.js";
import { GameNotifier } from "./queue/game_notification.js";
import { consumeUserNotifications } from "./queue/user_notification.js";
import { Wallet } from "ethers";
import { SubscriptionsTableName } from "./dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Notifier } from "./xmtp/notify/notifier.js"

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

// SQS
const gameQueueClient = new SQSClient(awsConfig);
const gameNotifier = new GameNotifier(gameQueueClient, process.env.AWS_SQS_QUEUE_GAME_URL);

// XMTP
const signer = new Wallet(process.env.XMTP_BOT_PRIVATE_KEY);
Client.create(signer, { env: "production" }).then(xmtpClient => {
    const userNotifier = new Notifier(xmtpClient, subscriptionsService);
    
    // Webhook
    const freestuffClient = new FreestuffClient(process.env.FREESTUFF_API_KEY);
    const httpServer = buildWebhookServer(process.env.FREESTUFF_WEBHOOK_SECRET, freestuffClient, gameNotifier);

    // consume game notifications
    consumeUserNotifications(gameQueueClient, process.env.AWS_SQS_QUEUE_GAME_URL, userNotifier);
    
    httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
        if (err) {
            throw err;
        }
    
        console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
    });
}).catch(err => console.error("Failed to initialize XMTP client", err));
