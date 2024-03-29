// NewWebhookHandler builds a freestuff webhook handler.
// It returns an async function that receives an Express request and response object.
export function NewWebhookHandler(webhookSecret, freestuffClient, notifier, isKilled, droppedStores) {
    return async (req, res) => {
        const requestBody = req.body;
        if (!requestBody) {
            res.status(400).send("No request body supplied");
            res.end();
            return;
        }
    
        if (requestBody.secret !== webhookSecret) {
            // reject anything without the needed secret
            res.status(401);
            res.end();
            return;
        }

        if (!!isKilled) {
            console.debug(`Webhook kill switch enabled; nothing will done for game IDs: ${requestBody.data}`);
            res.status(200);
            res.end();
            return;
        }
    
        console.log(`Handling event: '${requestBody.event}'`);

        if (requestBody.event !== "free_games") {
            res.status(200);
            res.end();
            // not a supported event
            return;
        }

        console.log(`Receive game IDs for free_games event: ${requestBody.data}`);
    
        // If the are no IDs, then do nothing
        if (!requestBody.data || !requestBody.data.length) {
            res.status(200);
            res.end();
            return;
        }

        const storeIsDropped = details => {
            if (!droppedStores || !details.store) {
                return false
            }

            return droppedStores.indexOf(details.store) >= 0;
        }
    
        try {
            const detailPromises = requestBody.data.map(gameID => freestuffClient.getGameDetails(gameID));
            const allGameDetails = await Promise.all(detailPromises);
            const freeGameDetails = allGameDetails.filter(g => !g.currentPrice)
                .filter(g => !storeIsDropped(g))
                .filter(g => g.kind === "game");
            const notifyPromises = freeGameDetails.map(gameDetails => notifier.notify(gameDetails, requestBody.notifyDefaultRecipientsOnly));
            await Promise.all(notifyPromises);
        } catch(error) {
            console.error("Unexpected error notifying about games:", error)
            res.status(500);
            res.end();

            return;
        }

        res.status(200);
        res.end();
    }
}
