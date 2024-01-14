import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SubscriptionsTableName } from "../dynamodb/constants.js";
import { SubscriptionsPage } from "./model.js";

export class DynamoDBSubscriptionService {
    constructor(dynamoDBClient) {
        this.dynamoDBClient = dynamoDBClient;
    }

    // getSubscriptionsPage gets the stored subscriptions as a SubscriptionsPage instance.
    // If a cursor is given, then the returned results will be a page starting from the
    // the given cursor. If the returned page has no results, it should be assumed that
    // there are no more subscriptions to be retrieved.
    // If the returned page has no cursor, it should, also, be treated as if there are no
    // more items to retrieve.
    async getSubscriptions(cursor) {
        const input = {
            TableName: SubscriptionsTableName,
            AttributesToGet: ["recipient_address"],
        };

        if (cursor) {
            input.ExclusiveStartKey = cursor;
        }

        const scanResult = await this.dynamoDBClient.send(new ScanCommand(input));
        const recipientAddresses = [];
        if (scanResult.Items && scanResult.Items.length) {
            scanResult.Items.forEach(item => {
                if (item["recipient_address"] && item["recipient_address"].S) {
                    recipientAddresses.push(item["recipient_address"].S);
                }
            })
        }

        return new SubscriptionsPage(recipientAddresses, scanResult.LastEvaluatedKey);
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