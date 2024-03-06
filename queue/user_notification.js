import { Consumer } from "sqs-consumer";
import { GameDetails } from "../freestuff/model.js";

// Builds a new handler for consuming user notification messages off of the queue.
export function newUserNotificationHandler(notifier, killSwitch) {
    return async (message) => {
        if (!!killSwitch) {
            console.debug("Kill switch enabled; no notifications will be sent out");
            return
        }

        const recipientAddress = message.MessageAttributes.RecipientAddress.StringValue;

        const data = JSON.parse(message.Body);
        const gameID = data.gameID;
        const gameTitle = data.gameTitle;
        const gameDescription = data.gameDescription;
        const storeURL = data.storeURL;
        const store = data.store;
        const currentPrice = data.currentPrice;
        const imageURL = data.imageURL;
        const kind = data.kind;

        let originalPrice;
        if (data.originalPrice) {
            originalPrice = data.originalPrice;
        }

        let expiryDate;
        if (data.expiryDate) {
            expiryDate = new Date(data.expiryDate);
        }

        const gameDetails = new GameDetails(gameID, gameTitle, gameDescription, storeURL, originalPrice, store, currentPrice, imageURL, expiryDate, kind);
        await notifier.notify(recipientAddress, gameDetails);
    };
}

// consumeUserNotifications consumes user notifications enqueued in the given URL.
export function consumeUserNotifications(sqsClient, sqsQueueURL, messageHandler, waitTimeSeconds, pollingWaitTimeMs) {
    const app = Consumer.create({
        batchSize: 10,
        waitTimeSeconds: parseInt(waitTimeSeconds) || 20,
        pollingWaitTimeMs: parseInt(pollingWaitTimeMs) || 20000,
        messageAttributeNames: [
            "RecipientAddress"
        ],
        sqs: sqsClient,
        queueUrl: sqsQueueURL,
        handleMessage: messageHandler
    });
    
    app.on('error', (err) => {
        console.error("Error consuming user notification", err);
    });
    
    app.on('processing_error', (err) => {
        console.error("Error processing user notification message", err);
    });
    
    app.start();
}