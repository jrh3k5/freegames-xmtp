import dotenv from 'dotenv';
import httpServer from './http_server/index.js';

dotenv.config();

httpServer.listen(process.env.FREESTUFF_WEBHOOK_PORT, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Running webhook on port ${process.env.FREESTUFF_WEBHOOK_PORT}`);
});