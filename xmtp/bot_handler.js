const unsubscribedSalutation = `Welcome to the free games bot! Message SUBSCRIBE to begin receiving notifications of free games!
\n
This is powered by https://freestuffbot.xyz, so the links you receive will be redirect.freestuffbot.xyz URLs.
\n
Message STOP at any time to stop receiving notifications.
`;

export function NewBotHandler(subscriptionsService) {
    return async (context) => {
        const recipientAddress = context.message.senderAddress;
        const isSubscribed = await subscriptionsService.isSubscribed(recipientAddress);
        if (isSubscribed) {
            switch (context.message.content.toLowerCase()) {
            case "stop":
                await subscriptionsService.unsubscribe(context.message.senderAddress);
                await context.reply("You have been unsubscribed from further notifications of free games.");
                break;
            default:
                await context.reply("Sorry, I don't understand. You can message STOP at any time to stop receiving notifications.");
            }
        } else {
            switch (context.message.content.toLowerCase()) {
            case "stop":
                await context.reply("You requested to stop receiving notifications, but you aren't subscribed. Message SUBSCRIBE to begin receiving notifications.");
                break;
            case "subscribe":
                await subscriptionsService.upsertSubscription(recipientAddress);
                await context.reply("You are now subscribed to receive notifications of free games. Look for messages from this account in your inbox!");
                break;
            default:
                await context.reply(unsubscribedSalutation);
            }
        }
    }
}