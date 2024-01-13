import dotenv from "dotenv";
import { buildWebhookServer } from "./http_server/index.js";
import { FreestuffClient } from "./freestuff/client.js";
import { Wallet } from "ethers";
import { Notifier } from "./xmtp/notify/notifier.js";
import { Client } from "@xmtp/xmtp-js";

dotenv.config();

// XMTP
const signer = new Wallet(process.env.XMTP_BOT_PRIVATE_KEY);
Client.create(signer, { env: "production" }).then(xmtpClient => {
    const notifier = new Notifier(xmtpClient, process.env.XMTP_BOT_RECIPIENTS.split(","));
    
    // Webhook
    const freestuffClient = new FreestuffClient(process.env.FREESTUFF_API_KEY);
    const httpServer = buildWebhookServer(process.env.FREESTUFF_WEBHOOK_SECRET, freestuffClient);
    
    httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
        if (err) {
            throw err;
        }
    
        console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
    });
}).catch(err => console.error("Failed to initialize XMTP client", err));
