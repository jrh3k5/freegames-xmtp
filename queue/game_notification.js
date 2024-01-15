import { Consumer } from "sqs-consumer";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

// This builds a consumer that ingests a game notification and multiplexes
// it into multiple user notifications for that game.
export function consumeGameNotifications(sqsClient,
                                         gameSQSQueueURL, userSQSQueueURL,
                                         subscriptionsService) {
    const app = Consumer.create({
        messageAttributeNames: ["GameTitle", "GameDescription", "StoreURL"],
        sqs: sqsClient,
        queueUrl: gameSQSQueueURL,
        handleMessage: async (message) => {
            const gameTitle = message.MessageAttributes.GameTitle.StringValue;
            const gameDescription = message.MessageAttributes.GameDescription.StringValue;
            const storeURL = message.MessageAttributes.StoreURL.StringValue;

            let subscriptionsResult = await subscriptionsService.getSubscriptions();
            do {
                for (let i = 0; i < subscriptionsResult.recipientAddresses.length; i++) {
                    const recipientAddress = subscriptionsResult.recipientAddresses[i];
                    console.debug(`Notifing recipient '${recipientAddress} of the free game '${gameTitle}'`);

                    const input = {
                        QueueUrl: userSQSQueueURL,
                        MessageAttributes: {
                            "GameTitle": {
                                DataType: "String",
                                StringValue: gameTitle
                            },
                            "GameDescription": {
                                DataType: "String",
                                StringValue: gameDescription
                            },
                            "RecipientAddress": {
                                DataType: "String",
                                StringValue: recipientAddress
                            },
                            "StoreURL": {
                                DataType: "String",
                                StringValue: storeURL
                            }
                        },
                        MessageBody: "_" // placeholder to satisfy minimum requirement
                    };

                    await sqsClient.send(new SendMessageCommand(input));
                }
    
                subscriptionsResult = await subscriptionsService.getSubscriptions(subscriptionsResult.cursor);
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

    async notify(gameDetails) {
        const input = {
            QueueUrl: this.queueURL,
            MessageAttributes: {
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
                }
            },
            MessageBody: "_" // placeholder to satisfy minimum requirement
        };

        await this.sqs.send(new SendMessageCommand(input));
    }
}