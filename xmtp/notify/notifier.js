export class Notifier {
    constructor(xmtpClient, recipientAddresses) {
        this.xmtpClient = xmtpClient;
        this.recipientAddresses = recipientAddresses;
    }

    notify(gameDetails) {
        const promises = this.recipientAddresses.map(receipientAddress => {
            return new Promise((resolve, reject) => {
                this.xmtpClient.conversations.newConversation(receipientAddress).then(conversation => {
                    conversation.send(buildMessage(gameDetails)).then(resolve).catch(reject);
                }).catch(reject);
            });
        });

        return Promise.all(promises);
    }
}

function buildMessage(gameDetails) {
    return `Free game: ${gameDetails.gameTitle}\n\nGet it here: ${gameDetails.url}`
}