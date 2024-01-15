import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { buildWebhookServer } from "./http_server/index.js";
import { Client } from "@xmtp/xmtp-js";
import dotenv from "dotenv";
import { FreestuffClient } from "./freestuff/client.js";
import { GameNotifier, consumeGameNotifications } from "./queue/game_notification.js";
import { consumeUserNotifications, newUserNotificationHandler } from "./queue/user_notification.js";
import { Wallet } from "ethers";
import { SubscriptionsTableName } from "./dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Notifier } from "./xmtp/notify/notifier.js"
import { NewWebhookHandler } from "./http_server/handler.js";

dotenv.config();

const awsConfig = {
    endpoint: process.env.AWS_ENDPOINT,
    region: process.env.AWS_REGION
};
const gameNotificationQueueURL = process.env.AWS_SQS_QUEUE_GAME_URL;
const userNotificationQueueURL = process.env.AWS_SQS_QUEUE_USERS_URL;

const dynamodbClient = new DynamoDBClient(awsConfig);

console.log("Waiting for subscriptions table presence");

// Wait for the table to exist
const results = await waitUntilTableExists({client: dynamodbClient, maxWaitTime: 30}, {TableName: SubscriptionsTableName})
if (results.state !== 'SUCCESS') {
    throw `Subscriptions table did not exist in sufficient time; result state was '${results.state}'`;
}
const subscriptionsService = new DynamoDBSubscriptionService(dynamodbClient);

// SQS
const sqsClient = new SQSClient(awsConfig);
const gameNotifier = new GameNotifier(sqsClient, gameNotificationQueueURL);

// XMTP
const signer = new Wallet(process.env.KEY);
Client.create(signer, { env: process.env.XMTP_ENV }).then(xmtpClient => {
    const xmtpNotifier = new Notifier(xmtpClient);
    
    // Webhook
    const freestuffClient = new FreestuffClient(process.env.FREESTUFF_API_KEY);
    const webhookHandler = NewWebhookHandler(process.env.FREESTUFF_WEBHOOK_SECRET, freestuffClient, gameNotifier, process.env.KILL_SWITCH_WEBHOOK);
    const httpServer = buildWebhookServer(webhookHandler);

    // consume game notifications
    consumeGameNotifications(sqsClient, gameNotificationQueueURL, userNotificationQueueURL, subscriptionsService);

    const userNotificationsHandler = newUserNotificationHandler(xmtpNotifier, process.env.KILL_SWITCH_XMTP_MESSAGES);
    consumeUserNotifications(sqsClient, userNotificationQueueURL, userNotificationsHandler);
    
    httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
        if (err) {
            throw err;
        }
    
        console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
    });
}).catch(err => console.error("Failed to initialize XMTP client", err));
