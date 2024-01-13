import dotenv from 'dotenv';
import { buildWebhookServer } from './http_server/index.js';
import { FreestuffClient } from './freestuff/client.js';

dotenv.config();

const freestuffClient = new FreestuffClient(process.env.FREESTUFF_API_KEY);
const httpServer = buildWebhookServer(process.env.FREESTUFF_WEBHOOK_SECRET, freestuffClient);

httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
});