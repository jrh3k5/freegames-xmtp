import { DynamoDBClient, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { buildWebhookServer } from "./http_server/index.js";
import dotenv from "dotenv";
import { FreestuffClient } from "./freestuff/client.js";
import { GameNotifier, consumeGameNotifications } from "./queue/game_notification.js";
import { consumeUserNotifications, newUserNotificationHandler } from "./queue/user_notification.js";
import { SubscriptionsTableName } from "./dynamodb/constants.js"
import { DynamoDBSubscriptionService } from "./subscriptions/dynamodb.js";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Notifier } from "./xmtp/notify/notifier.js"
import { NewWebhookHandler } from "./http_server/handler.js";
import { AttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { Retriever } from "./images/metadata/retriever.js";
import { newCache } from "./cache/cache.js";
import { CachingRetriever } from "./images/metadata/caching_retriever.js";
import { newClient } from "./xmtp/client.js";

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
const results = await waitUntilTableExists({client: dynamodbClient, maxWaitTime: 30, minDelay: 1, maxDelay: 2}, {TableName: SubscriptionsTableName})
if (results.state !== 'SUCCESS') {
    throw `Subscriptions table did not exist in sufficient time; result state was '${results.state}'`;
}
const subscriptionsService = new DynamoDBSubscriptionService(dynamodbClient);

const imageCache = newCache(3600); // cache images for one hour

// Image metadata resolution
const imageMetadataRetriever = new Retriever();
const cachingImageMetadataRetriever = new CachingRetriever(imageMetadataRetriever, imageCache);

// SQS
const sqsClient = new SQSClient(awsConfig);
const gameNotifier = new GameNotifier(sqsClient, gameNotificationQueueURL);

// XMTP
const xmtpClient = await newClient(process.env.KEY, process.env.XMTP_ENV, [new AttachmentCodec()]);

const xmtpNotifier = new Notifier(xmtpClient, cachingImageMetadataRetriever);

// Webhook
let droppedStores;
if (process.env.DROPPED_STORES) {
    droppedStores = process.env.DROPPED_STORES.split(",");
    console.log(`These stores will have their free game notifications dropped: ${droppedStores}`);
}
const freestuffClient = new FreestuffClient(process.env.FREESTUFF_API_KEY);
const webhookHandler = NewWebhookHandler(process.env.FREESTUFF_WEBHOOK_SECRET, freestuffClient, gameNotifier, process.env.KILL_SWITCH_WEBHOOK, droppedStores);
const httpServer = buildWebhookServer(webhookHandler);

// consume game notifications
consumeGameNotifications(sqsClient, gameNotificationQueueURL, userNotificationQueueURL, subscriptionsService, process.env.GAME_NOTIFICATION_POLLING_S, process.env.GAME_NOTIFICATION_POLLING_WAIT_MS);

const userNotificationsHandler = newUserNotificationHandler(xmtpNotifier, process.env.KILL_SWITCH_XMTP_MESSAGES);
consumeUserNotifications(sqsClient, userNotificationQueueURL, userNotificationsHandler, process.env.USER_NOTIFICATION_POLLING_S, process.env.USER_NOTIFICATION_POLLING_WAIT_MS);

httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
});
