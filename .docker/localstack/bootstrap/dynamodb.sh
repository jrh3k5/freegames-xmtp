#!/bin/bash

echo "Creating subscriptions table"

awslocal dynamodb create-table \
    --table-name=subscriptions \
    --attribute-definitions AttributeName=recipient_address,AttributeType=S \
    --key-schema AttributeName=recipient_address,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

awslocal dynamodb update-table \
    --table-name=subscriptions \
    --attribute-definitions AttributeName=active,AttributeType=S  \
      AttributeName=receipient_address,AttributeType=S  \
    --global-secondary-index-updates \
        "[
            {
                \"Create\": {
                    \"IndexName\": \"active-index\",
                    \"KeySchema\": [{\"AttributeName\":\"recipient_address\",\"KeyType\":\"HASH\"},
                                    {\"AttributeName\":\"active\",\"KeyType\":\"RANGE\"}],
                    \"Projection\":{
                        \"ProjectionType\":\"INCLUDE\",
                        \"NonKeyAttributes\":[\"ALL\"]
                    }
                }
            }
        ]"