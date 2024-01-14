import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SubscriptionsTableName } from "../dynamodb/constants.js";

export class DynamoDBSubscriptionService {
    constructor(dynamoDBClient) {
        this.dynamoDBClient = dynamoDBClient;
    }

    // upsertSubscription will create a subscription for the given address if it does not already exist
    // and update any data on the existing record if a record does already exist.
    async upsertSubscription(recipientAddress) {
        const input = {
            TableName: SubscriptionsTableName,
            Item: {
                "recipient_address": {
                    S: recipientAddress
                },
                "subscription_start_date": {
                    N: new Date().getTime()
                }
            },
            ConditionExpression: "attribute_not_exists(recipient_address)"
        };

        try {
            await this.dynamoDBClient.send(new PutItemCommand(input));
        } catch(error) {
            if (error["__type"] === "ConditionalCheckFailedException") {
                console.debug(`Recipient '${recipientAddress}' is already subscribed`);
                return;
            }

            throw error;
        }
    }
}