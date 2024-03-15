#!/bin/bash

# Create the SQS queues first so that the blocking on the table creation will block until these queues are created,
# preventing the services from failing to start due to absence of the queues.
echo "Creating game notification queue"
awslocal sqs create-queue --queue-name game_notifications.fifo --attributes FifoQueue=true

echo "Creating user notification queue"
awslocal sqs create-queue --queue-name user_notifications.fifo --attributes FifoQueue=true

echo "Creating subscriptions table"

awslocal dynamodb create-table \
    --table-name=subscriptions \
    --attribute-definitions AttributeName=recipient_address,AttributeType=S \
    --key-schema AttributeName=recipient_address,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
