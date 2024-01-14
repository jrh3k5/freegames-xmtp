export class Notifier {
    constructor(xmtpClient, subscriptionsService) {
        this.xmtpClient = xmtpClient;
        this.subscriptionsService = subscriptionsService;
    }

    async notify(gameDetails) {
        const message = buildMessage(gameDetails);

        let subscriptionsResult = await this.subscriptionsService.getSubscriptions();
        do {
            for (let i = 0; i < subscriptionsResult.recipientAddresses.length; i++) {
                const recipientAddress = subscriptionsResult.recipientAddresses[i];
                console.debug(`Notifing recipient '${recipientAddress} of the free game '${gameDetails.gameTitle}'`);

                const conversation = await this.xmtpClient.conversations.newConversation(recipientAddress);
                await conversation.send(message);
            }

            subscriptionsResult = await this.subscriptionsService.getSubscriptions(subscriptionsResult.cursor);
        } while(subscriptionsResult.recipientAddresses.length && subscriptionsResult.cursor)
    }
}

function buildMessage(gameDetails) {
    return `Free game: ${gameDetails.gameTitle}\n\nGet it here: ${gameDetails.url}`
}