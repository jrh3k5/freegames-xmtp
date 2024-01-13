// NewWebhookHandler builds a freestuff webhook handler.
// It returns a function that receives an Express request and response object.
export function NewWebhookHandler(webhookSecret, freestuffClient) {
    return (req, res) => {
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
    
        const detailPromises = requestBody.data.map(gameID => freestuffClient.getGameDetails(gameID));

        Promise.all(detailPromises).then(gameDetails => {
            console.log(gameDetails);
        }).catch(console.error);

        res.status(200);
        res.end();
    }
}
