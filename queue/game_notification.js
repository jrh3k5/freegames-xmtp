import { Consumer } from "sqs-consumer";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { getDefaultRecipients } from "../xmtp/notify/recipients.js";
import { GameDetails } from "../freestuff/model.js";

// This builds a consumer that ingests a game notification and multiplexes
// it into multiple user notifications for that game.
export function consumeGameNotifications(sqsClient,
                                         gameSQSQueueURL, userSQSQueueURL,
                                         subscriptionsService,
                                         waitTimeSeconds,
                                         pollingWaitTimeMs) {       
    const app = Consumer.create({
        batchSize: 10,
        waitTimeSeconds: parseInt(waitTimeSeconds) || 20,
        pollingWaitTimeMs: parseInt(pollingWaitTimeMs) || 20000,
        sqs: sqsClient,
        queueUrl: gameSQSQueueURL,
        messageAttributeNames: [
            "NotifyDefaultRecipientsOnly"
        ],
        handleMessage: async (message) => {
            const messageData = JSON.parse(message.Body);
            const gameID = messageData.gameID;
            const gameTitle = messageData.gameTitle;
            const gameDescription = messageData.gameDescription;
            const storeURL = messageData.storeURL;
            const store = messageData.store;
            const currentPrice = messageData.currentPrice;
            const imageURL = messageData.imageURL;
            const kind = messageData.kind;

            let originalPrice;
            if (messageData.originalPrice) {
                originalPrice = messageData.originalPrice;
            }

            let expiryDate;
            if (messageData.expiryDate) {
                expiryDate = new Date(messageData.expiryDate);
            }

            const gameDetails = new GameDetails(gameID, gameTitle, gameDescription, storeURL, originalPrice, store, currentPrice, imageURL, expiryDate, kind);

            // message.MessageAttributes can be undefined if there were no message attributes
            if (message.MessageAttributes && message.MessageAttributes.NotifyDefaultRecipientsOnly) {
                const defaultRecipients = getDefaultRecipients();
                console.log(`Message is configured to message only default receipients; enqueuing message to ${defaultRecipients.length} recipients`);

                const promises = defaultRecipients.map(receipientAddress => enqueueUserNotification(receipientAddress, gameDetails, sqsClient, userSQSQueueURL))
                await Promise.all(promises);

                return
            }

            let subscriptionsResult = await subscriptionsService.getSubscriptionAddresses();
            do {
                const promises = subscriptionsResult.recipientAddresses.map(recipientAddress => enqueueUserNotification(recipientAddress, gameDetails, sqsClient, userSQSQueueURL));

                await Promise.all(promises);
    
                subscriptionsResult = await subscriptionsService.getSubscriptionAddresses({
                    cursor: subscriptionsResult.cursor
                });
            } while(subscriptionsResult.recipientAddresses.length && subscriptionsResult.cursor)
        }
    });

    app.on('error', (err) => {
        console.error("Error consuming game notification", err);
    });
    
    app.on('processing_error', (err) => {
        console.error("Error processing game notification message", err);
    });
    
    app.start();
}

export class GameNotifier {
    constructor(sqs, queueURL) {
        this.sqs = sqs;
        this.queueURL = queueURL;
    }

    async notify(gameDetails, notifyDefaultOnly) {
        const gameID = gameDetails.gameID;
        
        const data = {
            gameID: gameID,
            gameTitle: gameDetails.gameTitle,
            gameDescription: gameDetails.gameDescription,
            storeURL: gameDetails.storeURL,
            store: gameDetails.store,
            currentPrice: `${gameDetails.currentPrice}`,
            imageURL: gameDetails.imageURL,
            kind: gameDetails.kind
        };

        if (gameDetails.expiryDate) {
            data.expiryDate = gameDetails.expiryDate.toISOString()
        }

        if (gameDetails.originalPrice) {
            data.originalPrice = `${gameDetails.originalPrice.toFixed(2)}`;
        }

        const messageAttributes = {};
        if (notifyDefaultOnly) {
            messageAttributes["NotifyDefaultRecipientsOnly"] = {
                DataType: "String",
                StringValue: "true"
            }
        }

        const input = {
            QueueUrl: this.queueURL,
            MessageAttributes: messageAttributes,
            MessageBody: JSON.stringify(data),
            MessageGroupId: gameID,
            MessageDeduplicationId: gameID
        };

        await this.sqs.send(new SendMessageCommand(input));
    }
}

async function enqueueUserNotification(recipientAddress, gameDetails, sqsClient, queueUrl) {
    const gameID = gameDetails.gameID;

    const data = {
        gameID: gameID,
        gameTitle: gameDetails.gameTitle,
        gameDescription: gameDetails.gameDescription,
        storeURL: gameDetails.storeURL,
        store: gameDetails.store,
        currentPrice: `${gameDetails.currentPrice}`,
        imageURL: gameDetails.imageURL,
        kind: gameDetails.kind
    };

    if (gameDetails.expiryDate) {
        data.expiryDate = gameDetails.expiryDate.toISOString();
    }

    if (gameDetails.originalPrice) {
        data.originalPrice = `${gameDetails.originalPrice}`;
    }

    const messageAttributes = {
        "RecipientAddress": {
            DataType: "String",
            StringValue: recipientAddress
        }
    };

    const input = {
        QueueUrl: queueUrl,
        MessageAttributes: messageAttributes,
        MessageBody: JSON.stringify(data),
        MessageGroupId: gameID,
        MessageDeduplicationId: `${gameID}-${recipientAddress}`
    };

    await sqsClient.send(new SendMessageCommand(input));
}
