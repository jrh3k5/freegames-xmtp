const unsubscribedSalutation = `Welcome to the free games bot! Message SUBSCRIBE to begin receiving notifications of free games!
\n
This is powered by https://freestuffbot.xyz, so the links you receive will be redirect.freestuffbot.xyz URLs.
\n
Message STOP at any time to stop receiving notifications.
`;

const unhandledInputResponse = `Sorry, I don't understand. You can message STOP at any time to stop receiving notifications.
\n
If you are encountering an issue with this bot, please log an issue at https://github.com/jrh3k5/freegames-xmtp/issues
`;

export function NewBotHandler(subscriptionsService, subscriptionAllowlist) {
    return async (context) => {
        if (context.message.recipientAddress == context.message.senderAddress) {
            // XMTP will echo back the message it sent, it seems.
            // In that case, ignore it.
            return;
        }
        
        const recipientAddress = context.message.senderAddress;
        const isSubscribed = await subscriptionsService.isSubscribed(recipientAddress);
        if (isSubscribed) {
            const normalizedMessage = context.message.content.trim().toLowerCase();
            if (!normalizedMessage) {
                // XMTP can sometimes trigger an echo because of a message sent out by the bot account,
                // so don't respond to these blank echoes
                return;
            }

            switch (normalizedMessage) {
            case "stop":
                await subscriptionsService.unsubscribe(recipientAddress);
                await context.reply("You have been unsubscribed from further notifications of free games.");
                break;
            default:
                await context.reply(unhandledInputResponse);
            }
        } else {
            switch (context.message.content.toLowerCase()) {
            case "stop":
                await context.reply("You requested to stop receiving notifications, but you aren't subscribed. Message SUBSCRIBE to begin receiving notifications.");
                break;
            case "subscribe":
                if (subscriptionAllowlist) {
                    if (subscriptionAllowlist.indexOf(recipientAddress.toLowerCase()) < 0) {
                        await context.reply("Sorry, you are not authorized to subscribe to this bot. Please try again a later date and time.");

                        return;
                    }
                }

                await subscriptionsService.upsertSubscription(recipientAddress);
                await context.reply("You are now subscribed to receive notifications of free games. Look for messages from this account in your inbox!");
                break;
            default:
                await context.reply(unsubscribedSalutation);
            }
        }
    }
}