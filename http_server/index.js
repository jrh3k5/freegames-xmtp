import express from "express"
import * as http from "http"
import helmet from "helmet"
import { NewWebhookHandler } from "./handler.js";

export function buildWebhookServer(webhookSecret, freestuffClient) {
    const app = express();
    app.use(helmet());
    app.use(express.json());
    
    const httpServer = http.Server(app);
    
    const webhookHandler = NewWebhookHandler(webhookSecret, freestuffClient);
    
    app.post("/freestuffbot.xyz/webhook", webhookHandler);

    return httpServer;
}
