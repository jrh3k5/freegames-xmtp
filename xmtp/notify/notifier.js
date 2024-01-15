export class Notifier {
    constructor(xmtpClient) {
        this.xmtpClient = xmtpClient;
    }

    async notify(recipientAddress, gameDetails) {
        // TODO: see if recipient addresses can be messaged, per XMTP
        const message = `Free game: ${gameDetails.gameTitle}\n\nGet it here: ${gameDetails.url}`;
        const conversation = await this.xmtpClient.conversations.newConversation(recipientAddress);
        await conversation.send(message);
    }
}
