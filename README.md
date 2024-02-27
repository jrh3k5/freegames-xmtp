# freegames-xmtp
An XMTP bot that broadcasts announcements of free games over XMTP to subscribers.

This project has been validated to run on Node 18.

## Deploying

This describes how to deploy this project.

### Prerequisites

This uses DynamoDB to store data and SQS to enqueue data. You must have set up in your account:

* A DynamoDB table named `subscriptions` with a key called `recipient_address`
* Two SQS queues named, each created as a FIFO queue:
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
* `KEY`: the private key to be used to sign messages sent to XMTP by the bot

#### Bot Access Control

You can specify the following (optional) environmental variables to control access to the bot:

* `XMTP_BOT_DEFAULT_RECIPIENTS`: a comma-delimited list of addresses to be loaded on startup as subscribers who will receive game notifications
* `XMTP_BOT_SUBSCRIBE_ALLOWLIST`: a comma-delimited list of addresses to which subscribing to the bot is to be limited

##### Gating Behind ETH Sends

(Work in Progress)

By default, users can subscribe by messaging the bot. However, access to subscriptions can be gated behind users who have sent ETH to a configured recipient address. Subscribing users is managed by the `eth_monitor.js` executable.

This requires an Alchemy API key, as this uses the Alchemy transaction subscriptions to listen for ETH sends. This, at this time, requires a high availability of the monitor; if it is down, then it will not automatically detect sends and subscribe users. Manual correction will be necessary at that time.

To configure this behavior, supply the following parameters:

* `ALCHEMY_API_KEY`: your Alchemy API key for the network on which you can receive funds
* `ALCHEMY_NETWORK_ID`: the network ID (corresponding to the Alchemy SDK's [network ID values](https://github.com/alchemyplatform/alchemy-sdk-js/blob/2593cfff2aa6060c3823166c9af61b346a3ba5c7/src/types/types.ts#L81-L99))
* `SUBSCRIPTION_RECEIPT_ADDRESS`: the address to which users must send funds in order to subscribe
* `SUBSCRIPTION_DURATION_MINUTES` (default: 30 days of minutes): the number of minutes a subscription should last
* `SUBSCRIPTION_MINIMUM_GWEI`: the minimum amount of gwei a user must send to the configured receipt address to subscribe to the bot
* `SUBSCRIPTION_NETWORK_BLOCKS_PER_MINUTE` (default: 30): the number of blocks the configured network produces in a minute

#### Kill Switches

This supports the following kill switches:

* `KILL_SWITCH_XMTP_MESSAGES`: (default `false`); if set to `true`, then messages from the user notification queue will be consumed, but no messages will be sent via XMTP
* `KILL_SWITCH_WEBHOOK`: (default `false`); if set to to `true`, then requests will be received via the webhook, but no game notification messages will be enqueued and no lookups of game details will be executed

#### Dropping Stores

If you find that some stores are too spammy in their messaging, you can set the `DROPPED_STORES` parameter to a comma-delimited list of values that are defined as [stores](https://docs.freestuffbot.xyz/v1/types#store) in the FreeStuff API.

#### SQS Polling

The following can be used to configure the frequency of message polling in this system.

* `GAME_NOTIFICATION_POLLING_S` (default 20, max 20): the number of seconds that should elapse between polling the game notification queue for messages
* `GAME_NOTIFICATION_POLLING_WAIT_MS` (default 20000): the number of milliseconds to wait while polling to receive a message before re-polling the game notification queue
* `USER_NOTIFICATION_POLLING_S` (default 20, max 20): the number of seconds that should elapse between polling the user notification queue for messages
* `USER_NOTIFICATION_POLLING_WAIT_MS` (default 20000): the number of milliseconds to wait while polling to receive a message before re-polling the user notification queue

### Running the Application

Install the source of this project in a desired location. Make sure to run `npm ci`

To launch the webhook and webhook processing pipeline, execute:

```
node webhook.js
```

To launch the bot that handles user engagement, execute:

```
node bot.js
```

To launch the process that listens for user ETH sends to register them, execute:

```
node eth_monitor.js
```

## Troubleshooting

The webhook can be invoked with a `notifyDefaultRecipientsOnly` option (as demonstrated in the [running locally](#running-locally) portion of this document) to only notify the configured default recipients. This allows the processing of messages but without the risk of notifying all subscribed users.

## Running Locally

First, create configuration for your deployment by copying the example `.env.sample` file:

```
cp .env.sample .env
```

Most of these values are defined in `docker-compose.yaml`; you only need to provide:

* `FREESTUFF_API_KEY`
* `KEY`
* `XMTP_BOT_DEFAULT_RECIPIENTS`

To get an API key to populate the `FREESTUFF_API_KEY` variable, refer to freestuffbot's documentation [here](https://docs.freestuffbot.xyz/).

Then use Docker to start the service:

```
docker compose up -d
```

Once that is running, you can then simulate a [webhook invocation](https://docs.freestuffbot.xyz/v1/webhooks) with cURL:

```
curl -i -X POST http://localhost:12345/freestuffbot.xyz/webhook \
  -H "Content-Type: application/json" \
  -d '{ "event": "free_games", "secret": "wdaji29dJadj91jAjd9a92eDak2", "data": [ 565940 ], "notifyDefaultRecipientsOnly": true }'
```

If the above example's game IDs are too old and are not returning any data, you can fetch the currently-listed free games using this request:

```
curl -i https://api.freestuffbot.xyz/v1/games/free \
  -H "Accept: application/json" \
  -H "Authorization: Basic <your API key here>"
```

### Running Integration Tests

If you wish to run the integration tests locally, execute the following:

```
docker compose -f docker-compose.integration_test.yml up localstack -d && sleep 10 && npm run itest
```
