// NewWebhookHandler builds a freestuff webhook handler.
// It returns a function that receives an Express request and response object.
export function NewWebhookHandler(webhookSecret) {
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
    
        console.log("request body", req.body);
        res.status(200);
        res.end();
    }
}
