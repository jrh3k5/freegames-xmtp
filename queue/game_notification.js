import { SendMessageCommand } from "@aws-sdk/client-sqs";

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