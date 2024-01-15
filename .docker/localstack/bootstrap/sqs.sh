#!/bin/bash

echo "Creating game notification queue"
awslocal sqs create-queue --queue-name game_notifications.fifo --attributes FifoQueue=true

echo "Creating user notification queue"
awslocal sqs create-queue --queue-name user_notifications.fifo --attributes FifoQueue=true
