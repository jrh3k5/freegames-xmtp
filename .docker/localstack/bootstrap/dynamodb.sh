#!/bin/bash

echo "Creating subscriptions table"

awslocal dynamodb create-table \
    --table-name=subscriptions \
    --attribute-definitions AttributeName=recipient_address,AttributeType=S \
    --key-schema AttributeName=recipient_address,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST