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
        messageAttributeNames: [
            "GameID", 
            "GameTitle", 
            "GameDescription", 
            "StoreURL", 
            "OriginalPrice", 
            "Store", 
            "NotifyDefaultRecipientsOnly", 
            "CurrentPrice", 
            "ImageURL",
            "ExpiryDate",
            "Kind"
        ],
        sqs: sqsClient,
        queueUrl: gameSQSQueueURL,
        handleMessage: async (message) => {
            const gameID = message.MessageAttributes.GameID.StringValue;
            const gameTitle = message.MessageAttributes.GameTitle.StringValue;
            const gameDescription = message.MessageAttributes.GameDescription.StringValue;
            const storeURL = message.MessageAttributes.StoreURL.StringValue;
            const store = message.MessageAttributes.Store.StringValue;
            const currentPrice = message.MessageAttributes.CurrentPrice.StringValue;
            const imageURL = message.MessageAttributes.ImageURL.StringValue;
            const kind = message.MessageAttributes.Kind.StringValue;

            let originalPrice;
            if (message.MessageAttributes.OriginalPrice) {
                originalPrice = message.MessageAttributes.OriginalPrice.StringValue;
            }

            let expiryDate;
            if (message.MessageAttributes.ExpiryDate) {
                expiryDate = new Date(message.MessageAttributes.ExpiryDate.StringValue);
            }

            const gameDetails = new GameDetails(gameID, gameTitle, gameDescription, storeURL, originalPrice, store, currentPrice, imageURL, expiryDate, kind);

            if (message.MessageAttributes.NotifyDefaultRecipientsOnly) {
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
        
        const messageAttributes = {
            "GameID": {
                DataType: "String",
                StringValue: gameID
            },
            "GameTitle": {
                DataType: "String",
                StringValue: gameDetails.gameTitle
            },
            "GameDescription": {
                DataType: "String",
                StringValue: gameDetails.gameDescription
            },
            "StoreURL": {
                DataType: "String",
                StringValue: gameDetails.url
            },
            "Store": {
                DataType: "String",
                StringValue: gameDetails.store
            },
            "CurrentPrice": {
                DataType: "String",
                StringValue: `${gameDetails.currentPrice}`
            },
            "ImageURL": {
                DataType: "String",
                StringValue: gameDetails.imageURL
            },
            "Kind": {
                DataType: "String",
                StringValue: gameDetails.kind
            }
        };

        if (notifyDefaultOnly) {
            messageAttributes["NotifyDefaultRecipientsOnly"] = {
                DataType: "String",
                StringValue: "true"
            }
        }

        if (gameDetails.expiryDate) {
            messageAttributes["ExpiryDate"] = {
                DataType: "String",
                StringValue: gameDetails.expiryDate.toISOString()
            }
        }

        if (gameDetails.originalPrice) {
            messageAttributes["OriginalPrice"] = {
                DataType: "String",
                StringValue: `${gameDetails.originalPrice.toFixed(2)}`
            }
        }

        const input = {
            QueueUrl: this.queueURL,
            MessageAttributes: messageAttributes,
            MessageBody: "_", // placeholder to satisfy minimum requirement
            MessageGroupId: gameID,
            MessageDeduplicationId: gameID
        };

        await this.sqs.send(new SendMessageCommand(input));
    }
}

async function enqueueUserNotification(recipientAddress, gameDetails, sqsClient, queueUrl) {
    const gameID = gameDetails.gameID;

    const messageAttributes = {
        "GameID": {
            DataType: "String",
            StringValue: gameID
        },
        "GameTitle": {
            DataType: "String",
            StringValue: gameDetails.gameTitle
        },
        "GameDescription": {
            DataType: "String",
            StringValue: gameDetails.gameDescription
        },
        "RecipientAddress": {
            DataType: "String",
            StringValue: recipientAddress
        },
        "StoreURL": {
            DataType: "String",
            StringValue: gameDetails.url
        },
        "Store": {
            DataType: "String",
            StringValue: gameDetails.store
        },
        "CurrentPrice": {
            DataType: "String",
            StringValue: `${gameDetails.currentPrice}`
        },
        "ImageURL": {
            DataType: "String",
            StringValue: gameDetails.imageURL
        },
        "Kind": {
            DataType: "String",
            StringValue: gameDetails.kind
        }
    };

    if (gameDetails.expiryDate) {
        messageAttributes["ExpiryDate"] = {
            DataType: "String",
            StringValue: gameDetails.expiryDate.toISOString()
        }
    }

    if (gameDetails.originalPrice) {
        messageAttributes["OriginalPrice"] = {
            DataType: "String",
            StringValue: `${gameDetails.originalPrice}`
        }
    }

    const input = {
        QueueUrl: queueUrl,
        MessageAttributes: messageAttributes,
        MessageBody: "_", // placeholder to satisfy minimum requirement
        MessageGroupId: gameID,
        MessageDeduplicationId: `${gameID}-${recipientAddress}`
    };

    await sqsClient.send(new SendMessageCommand(input));
}
