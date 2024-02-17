
import { NoGameImageURL, getHumanReadableStoreName } from "../../freestuff/model.js";
import { ContentTypeAttachment } from "@xmtp/content-type-remote-attachment";

export class Notifier {
    constructor(xmtpClient, imageMetadataRetriever) {
        this.xmtpClient = xmtpClient;
        this.imageMetadataRetriever = imageMetadataRetriever;
    }

    async notify(recipientAddress, gameDetails) {
        const conversation = await this.xmtpClient.conversations.newConversation(recipientAddress);

        // Send the image first so that the main details show up first in the conversation thread when the user opens it
        try {
            await this.sendGameImage(conversation, gameDetails);
        } catch(error) {
            // Don't let issues of sendin the image prevent the sending of the message, itself
            console.debug(`Failed to send image for game ID ${gameDetails.gameID}`, error);
        }

        const storeName = getHumanReadableStoreName(gameDetails.store);
        let message = `${gameDetails.gameTitle}\n\nGet it from ${storeName} here: ${gameDetails.url}\n\nIf this link doesn't open properly in your app's embedded browser, try copying the link directly into your phone's browser.`;
        if (gameDetails.originalPrice) {
            message = `Free game (originally \$${gameDetails.originalPrice}): ${message}`;
        }
        await conversation.send(message);
    }

    async sendGameImage(conversation, gameDetails) {
        if (!gameDetails.imageURL || gameDetails.imageURL === NoGameImageURL) {
            return
        }

        const imageURL = gameDetails.imageURL;
        const attachment = await this.imageMetadataRetriever.getMetadata(imageURL);

        await conversation.send(attachment, {
            contentType: ContentTypeAttachment,
        });
    }
}
