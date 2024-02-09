import { getHumanReadableStoreName } from "../../freestuff/model.js";

export class Notifier {
    constructor(xmtpClient) {
        this.xmtpClient = xmtpClient;
    }

    async notify(recipientAddress, gameDetails) {
        const storeName = getHumanReadableStoreName(gameDetails.store);
        let message = `${gameDetails.gameTitle}\n\nGet it from ${storeName} here: ${gameDetails.url}\n\nIf this link doesn't open properly in your app's embedded browser, try copying the link directly into your phone's browser.`;
        if (gameDetails.originalPrice) {
            message = `Free game (originally \$${gameDetails.originalPrice}): ${message}`;
        }
        const conversation = await this.xmtpClient.conversations.newConversation(recipientAddress);
        await conversation.send(message);
    }
}
