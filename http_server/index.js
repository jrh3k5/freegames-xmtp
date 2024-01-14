import express from "express"
import * as http from "http"
import helmet from "helmet"
import { NewWebhookHandler } from "./handler.js";

export function buildWebhookServer(webhookSecret, freestuffClient, notifier) {
    const app = express();
    app.use(helmet());
    app.use(express.json());
    
    const httpServer = http.Server(app);
    
    const webhookHandler = NewWebhookHandler(webhookSecret, freestuffClient, notifier);
    
    app.post("/freestuffbot.xyz/webhook", webhookHandler);
    app.get("/_health", (_, res) => {
        res.status(200);
        res.end();
    });

    return httpServer;
}
