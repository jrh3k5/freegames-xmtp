#!/bin/bash

echo "Creating game notification queue"
awslocal sqs create-queue --queue-name game_notifications

echo "Creating user notification queue"
awslocal sqs create-queue --queue-name user_notifications