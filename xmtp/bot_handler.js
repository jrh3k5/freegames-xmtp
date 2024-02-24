const unsubscribedSalutation = `Welcome to the free games bot! Message SUBSCRIBE to begin receiving notifications of free games!
\n
This is powered by https://freestuffbot.xyz, so the links you receive will be redirect.freestuffbot.xyz URLs.
\n
Message STOP at any time to stop receiving notifications.
`;

const helpResponse = "If you are encountering an issue with this bot, please log an issue at https://github.com/jrh3k5/freegames-xmtp/issues";

export function newBotHandler(subscriptionsService, subscriptionAllowlist) {
    return async (message) => {
        const recipientAddress = message.senderAddress;
        const isSubscribed = await subscriptionsService.isSubscribed(recipientAddress);
        if (isSubscribed) {
            const normalizedMessage = message.content.trim().toLowerCase();
            if (!normalizedMessage) {
                // XMTP can sometimes trigger an echo because of a message sent out by the bot account,
                // so don't respond to these blank echoes
                return;
            }

            switch (normalizedMessage) {
            case "stop":
                await subscriptionsService.unsubscribe(recipientAddress);
                await message.conversation.send("You have been unsubscribed from further notifications of free games.");
                break;
            case "help":
                await message.conversation.send(helpResponse);
                break;
            default:
                // deliberately do nothing, as the bot seems to respond to messages it sends
            }
        } else {
            switch (message.content.toLowerCase()) {
            case "stop":
                await message.conversation.send("You requested to stop receiving notifications, but you aren't subscribed. Message SUBSCRIBE to begin receiving notifications.");
                break;
            case "subscribe":
                if (subscriptionAllowlist) {
                    if (subscriptionAllowlist.indexOf(recipientAddress.toLowerCase()) < 0) {
                        await message.conversation.send("Sorry, you are not authorized to subscribe to this bot. Please try again a later date and time.");

                        return;
                    }
                }

                await subscriptionsService.upsertSubscription(recipientAddress);
                await message.conversation.send("You are now subscribed to receive notifications of free games. Look for messages from this account in your inbox!");
                break;
            default:
                await message.conversation.send(unsubscribedSalutation);
            }
        }
    }
}