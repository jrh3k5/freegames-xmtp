# freegames-xmtp
An XMTP bot that broadcasts announcements of free games over XMTP to subscribers.

This project has been validated to run on Node 18.

## Deploying

This describes how to deploy this project.

### Prerequisites

This uses DynamoDB to store data and SQS to enqueue data. You must have set up in your account:

* A DynamoDB table named `subscriptions` with a key called `recipient_address`
* Two SQS queues named:
  * `game_notifications`
  * `user_notifications`

### Configuration

To deploy this project, create a copy of the `.env.sample` file and fill out the configuratio properties presented in that file:

* `AWS_REGION`: the AWS region into which you are deploying the application
  * `AWS_ENDPOINT` only needs to be provided if you are using an alternative DynamoDB provider, such as LocalStack
* `AWS_SQS_QUEUE_GAME_URL`: the URL of the SQS queue used to contain the queued game notifications
* `AWS_SQS_QUEUE_USERS_URL`: the URL of the SQS queue used to contain queued notifications for users
* `FREESTUFF_WEBHOOK_PORT`: the port on which this bot should listen for webhook requests
* `FREESTUFF_WEBHOOK_SECRET`: the secret shared with the freestuffbot.xyz API to authenticate webhook requests
* `FREESTUFF_API_KEY`: the API key used to make requests to the freestuffbot.xyz API
* `XMTP_BOT_DEFAULT_RECIPIENTS`: a comma-delimited list of addresses to be loaded on startup as subscribers who will receive game notifications
* `XMTP_BOT_PRIVATE_KEY`: the private key to be used to sign messages sent to XMTP by the bot

Install the source of this project in a desired location and then execute:

```
node index.js
```

## Running Locally

First, create configuration for your deployment by copying the example `.env.sample` file:

```
cp .env.sample .env
```

Most of these values are defined in `docker-compose.yaml`; you only need to provide:

* `FREESTUFF_API_KEY`
* `XMTP_BOT_DEFAULT_RECIPIENTS`
* `XMTP_BOT_PRIVATE_KEY`

To get an API key to populate the `FREESTUFF_API_KEY` variable, refer to freestuffbot's documentation [here](https://docs.freestuffbot.xyz/).

Then use Docker to start the service:

```
docker compose up -d
```

Once that is running, you can then simulate a [webhook invocation](https://docs.freestuffbot.xyz/v1/webhooks) with cURL:

```
curl -i -X POST http://localhost:12345/freestuffbot.xyz/webhook \
  -H "Content-Type: application/json" \
  -d '{ "event": "free_games", "secret": "wdaji29dJadj91jAjd9a92eDak2", "data": [ 565940 ] }'
```

If the above example's game IDs are too old and are not returning any data, you can fetch the currently-listed free games using this request:

```
curl -i https://api.freestuffbot.xyz/v1/games/free \
  -H "Accept: application/json" \
  -H "Authorization: Basic <your API key here>"
```
