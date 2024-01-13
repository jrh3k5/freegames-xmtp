import dotenv from 'dotenv';
import { buildWebhookServer } from './http_server/index.js';

dotenv.config();

const httpServer = buildWebhookServer(process.env.FREESTUFF_WEBHOOK_SECRET);

httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
});