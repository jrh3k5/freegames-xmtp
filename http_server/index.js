import express from "express"
import * as http from "http"
import helmet from "helmet"

const app = express();
app.use(helmet());
app.use(express.json());

const httpServer = http.Server(app);

app.post("/freestuffbot.xyz/webhook", (req, res) => {
    const requestBody = req.body;
    if (!requestBody) {
        res.status(400).send("No request body supplied");
        res.end();
        return;
    }

    if (requestBody.secret !== process.env.FREESTUFF_WEBHOOK_SECRET) {
        // reject anything without the needed secret
        res.status(401);
        res.end();
        return;
    }

    if (requestBody.event !== "free_games") {
        res.status(200);
        res.end();
        // not a supported event
        return;
    }

    // If the are no IDs, then do nothing
    if (!requestBody.data || !requestBody.data.length) {
        res.status(200);
        res.end();
        return;
    }

    console.log("request body", req.body);
    res.status(200);
    res.end();
})

export default httpServer;