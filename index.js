import { DynamoDBClient, CreateTableCommand, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { buildWebhookServer } from "./http_server/index.js";
import { Client } from "@xmtp/xmtp-js";
import dotenv from "dotenv";
import { FreestuffClient } from "./freestuff/client.js";
import { Notifier } from "./xmtp/notify/notifier.js";
import { Wallet } from "ethers";

dotenv.config();

const dynamodbClient = new DynamoDBClient({
    endpoint: process.env.AWS_ENDPOINT,
    region: process.env.AWS_REGION
});

// Wait for the table to exist
const results = await waitUntilTableExists({client: dynamodbClient, maxWaitTime: 30}, {TableName: "subscriptions"})
if (results.state !== 'SUCCESS') {
    dynamodbClient
    throw `Subscriptions table did not exist in sufficient time; result state was '${results.state}'`;
}

// XMTP
const signer = new Wallet(process.env.XMTP_BOT_PRIVATE_KEY);
Client.create(signer, { env: "production" }).then(xmtpClient => {
    const notifier = new Notifier(xmtpClient, process.env.XMTP_BOT_RECIPIENTS.split(","));
    
    // Webhook
    const freestuffClient = new FreestuffClient(process.env.FREESTUFF_API_KEY);
    const httpServer = buildWebhookServer(process.env.FREESTUFF_WEBHOOK_SECRET, freestuffClient, notifier);
    
    httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
        if (err) {
            throw err;
        }
    
        console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
    });
}).catch(err => console.error("Failed to initialize XMTP client", err));
