import express from "express"
import * as http from "http"
import helmet from "helmet"

export function buildWebhookServer(webhookHandler) {
    const app = express();
    app.use(helmet());
    app.use(express.json());
    
    const httpServer = http.Server(app);
    
    app.post("/freestuffbot.xyz/webhook", webhookHandler);
    app.get("/_health", (_, res) => {
        res.status(200);
        res.end();
    });

    return httpServer;
}
