import { GetItemCommand, DeleteItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SubscriptionsTableName } from "../dynamodb/constants.js";
import { SubscriptionsPage } from "./model.js";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export class DynamoDBSubscriptionService {
    constructor(dynamoDBClient) {
        this.dynamoDBClient = dynamoDBClient;
        this.dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);
    }

    // isSubscribed determines if the given recipient address has subscribed.
    async isSubscribed(recipientAddress) {
        if (!recipientAddress) {
            return false
        }

        const normalizedAddress = recipientAddress.toLowerCase();

        const input = {
            TableName: SubscriptionsTableName,
            Key: {
                "recipient_address": {
                    S: normalizedAddress
                }
            },
            FilterExpression: "active = :active",
            ExpressionAttributeValues: {
                ":active": "true"
            }
        };

        const getResult = await this.dynamoDBClient.send(new GetItemCommand(input));
        if (!getResult.Item) {
            return false;
        }

        const activeRecord = getResult.Item["active"];
        return activeRecord && activeRecord.S === "true";
    }

    // Gets the stored subscriptions as a SubscriptionsPage instance.
    // The options parameter is optional and can contain the following properties:
    //  - cursor: the cursor from which searching should start (default: no cursor)
    // If a cursor is given, then the returned results will be a page starting from the
    // the given cursor. If the returned page has no results, it should be assumed that
    // there are no more subscriptions to be retrieved.
    // If the returned page has no cursor, it should, also, be treated as if there are no
    // more items to retrieve.
    async getSubscriptionAddresses(options) {
        let cursor;

        if (options) {
            
        }

        const input = {
            TableName: SubscriptionsTableName,
            FilterExpression: "active = :active",
            ExpressionAttributeValues: {
                ":active": {
                    S: "true"
                }
            }
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

    // unsubscribe removes the given address from being subscribed to notifications.
    async unsubscribe(recipientAddress) {
        if (!recipientAddress) {
            return
        }

        const normalizedAddress = recipientAddress.toLowerCase();

        const activeUpdateCommand = new UpdateCommand({
            TableName: SubscriptionsTableName,
            Key: {
                "recipient_address": normalizedAddress
            },
            UpdateExpression: "set active = :active",
            ExpressionAttributeValues: {
                ":active": "false"
            },
        })

        await this.dynamoDBDocumentClient.send(activeUpdateCommand);
    }

    // upsertSubscription will create a subscription for the given address if it does not already exist
    // and update any data on the existing record if a record does already exist.
    async upsertSubscription(recipientAddress, subscriptionExpiryBlock) {
        if (!recipientAddress) {
            return
        }
        
        const normalizedAddress = recipientAddress.toLowerCase();

        try {
            const putItemInput = {
                "active": {
                    S: "true"
                },
                "recipient_address": {
                    S: normalizedAddress
                },
                "subscription_start_date": {
                    N: `${new Date().getTime()}`
                }
            };

            if (subscriptionExpiryBlock) {
                putItemInput["subscription_expiry_block"] = {
                    N: `${subscriptionExpiryBlock}`
                }
            }

            await this.dynamoDBClient.send(new PutItemCommand({
                TableName: SubscriptionsTableName,
                Item: putItemInput,
                ConditionExpression: "attribute_not_exists(recipient_address)"
            }));

            return;
        } catch(error) {
            if (!(error["__type"] || "").endsWith("ConditionalCheckFailedException")) {
                throw error;
            }
        }

        const updateExpressions = [];
        updateExpressions.push("active = :active");

        const expressionAttributeValues = {};
        expressionAttributeValues[":active"] = "true"

        if (subscriptionExpiryBlock) {
            updateExpressions.push("subscription_expiry_block = :subscriptionExpiryBlock")
            expressionAttributeValues[":subscriptionExpiryBlock"] = `${subscriptionExpiryBlock}`
        }

        const blockUpdateCommand = new UpdateCommand({
            TableName: SubscriptionsTableName,
            Key: {
                "recipient_address": normalizedAddress
            },
            UpdateExpression: `set ${updateExpressions.join(", ")}`,
            ExpressionAttributeValues: expressionAttributeValues
        });

        await this.dynamoDBDocumentClient.send(blockUpdateCommand);

        return;
    }
}