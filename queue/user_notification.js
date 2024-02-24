import { Consumer } from "sqs-consumer";
import { GameDetails } from "../freestuff/model.js";

// Builds a new handler for consuming user notification messages off of the queue.
export function newUserNotificationHandler(notifier, killSwitch) {
    return async (message) => {
        if (!!killSwitch) {
            console.debug("Kill switch enabled; no notifications will be sent out");
            return
        }

        const gameID = message.MessageAttributes.GameID.StringValue;
        const recipientAddress = message.MessageAttributes.RecipientAddress.StringValue;
        const gameTitle = message.MessageAttributes.GameTitle.StringValue;
        const gameDescription = message.MessageAttributes.GameDescription.StringValue;
        const storeURL = message.MessageAttributes.StoreURL.StringValue;
        let originalPrice;
        if (message.MessageAttributes.OriginalPrice) {
            originalPrice = message.MessageAttributes.OriginalPrice.StringValue;
        }
        const store = message.MessageAttributes.Store.StringValue;
        const currentPrice = message.MessageAttributes.CurrentPrice.StringValue;
        const imageURL = message.MessageAttributes.ImageURL.StringValue;

        let expiryDate;
        if (message.MessageAttributes.ExpiryDate) {
            expiryDate = new Date(message.MessageAttributes.ExpiryDate.StringValue);
        }

        const gameDetails = new GameDetails(gameID, gameTitle, gameDescription, storeURL, originalPrice, store, currentPrice, imageURL, expiryDate);
        await notifier.notify(recipientAddress, gameDetails);
    };
}

// consumeUserNotifications consumes user notifications enqueued in the given URL.
export function consumeUserNotifications(sqsClient, sqsQueueURL, messageHandler) {
    const app = Consumer.create({
        batchSize: 10,
        pollingWaitTimeMs: 20000,
        messageAttributeNames: [
            "GameID", 
            "GameTitle", 
            "GameDescription", 
            "RecipientAddress", 
            "StoreURL", 
            "OriginalPrice", 
            "Store", 
            "CurrentPrice",
            "ImageURL",
            "ExpiryDate"
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