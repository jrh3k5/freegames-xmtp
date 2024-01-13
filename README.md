# freegames-xmtp
An XMTP bot that broadcasts announcements of free games over XMTP to subscribers

## Running Locally

You can run this locally by executing:

```
npm run start
```

Following that, copy the example `.env.sample` file:

```
cp .env.sample .env
```

**Note**: if you are following these steps to actually deploy this bot, _make sure you change the secret_.

You can then simulate a [webhook invocation](https://docs.freestuffbot.xyz/v1/webhooks) with cURL:

```
curl -i -X POST http://localhost:12345/freestuffbot.xyz/webhook \
  -H "Content-Type: application/json" \
  -d '{ "event": "free_games", "secret": "wdaji29dJadj91jAjd9a92eDak2", "data": [ 142312, 499128 ] }'
```

This will not be able to complete the call as given, however, due to the absence of a configured API key.

To get an API key, refer to freestuffbot's documentation [here](https://docs.freestuffbot.xyz/).