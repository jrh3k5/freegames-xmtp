import { Consumer } from "sqs-consumer";
import { GameDetails } from "../freestuff/model.js";

// consumeUserNotifications consumes user notifications enqueued in the given URL.
export function consumeUserNotifications(sqsClient, sqsQueueURL, notifier) {
    const app = Consumer.create({
        messageAttributeNames: ["GameTitle", "GameDescription", "RecipientAddress", "StoreURL"],
        sqs: sqsClient,
        queueUrl: sqsQueueURL,
        handleMessage: async (message) => {
            const recipientAddress = message.MessageAttributes.RecipientAddress.StringValue;
            const gameTitle = message.MessageAttributes.GameTitle.StringValue;
            const gameDescription = message.MessageAttributes.GameDescription.StringValue;
            const storeURL = message.MessageAttributes.StoreURL.StringValue;
            const gameDetails = new GameDetails(gameTitle, gameDescription, storeURL);
            await notifier.notify(recipientAddress, gameDetails);
        }
    });
    
    app.on('error', (err) => {
        console.error("Error consuming user notification", err);
    });
    
    app.on('processing_error', (err) => {
        console.error("Error processing user notification message", err);
    });
    
    app.start();
}