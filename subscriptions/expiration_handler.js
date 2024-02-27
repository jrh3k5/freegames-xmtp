import { formatEther } from "ethers";

export class ExpirationHandler {
    constructor(subscriptionsService, xmtpClient, minimumWei, sendAddress) {
        this.subscriptionsService = subscriptionsService;
        this.xmtpClient = xmtpClient;
        this.minimumWei = minimumWei;
        this.sendAddress = sendAddress;
    }

    async deactivateExpiredSubscriptions(expiryBlockThreshold) {
        let page = await this.subscriptionsService.getSubscriptionAddresses({
            expiryThreshold: expiryBlockThreshold
        });
        
        if (!page.recipientAddresses.length) {
            return 0;
        }

        const toUnsubscribe = [];
        do {
            page.recipientAddresses.forEach(address => toUnsubscribe.push(address));

            page = await this.subscriptionsService.getSubscriptionAddresses({
                cursor: page.cursor,
                expiryThreshold: expiryBlockThreshold
            });
        } while(page.recipientAddresses && page.recipientAddresses.length && page.cursor);

        const unsubscribePromises = toUnsubscribe.map(address => this.deactivateSubscription(address));
        await Promise.all(unsubscribePromises);
        return unsubscribePromises.length;
    }

    async deactivateSubscription(address) {
        await this.subscriptionsService.unsubscribe(address);

        const conversation = await this.xmtpClient.conversations.newConversation(address);
        const ethValue = formatEther(this.minimumWei);
        const message = `Your subscription to the free games bot has expired! You can send ${ethValue} ETH to ${this.sendAddress} to resubscribe at any time.`;
        await conversation.send(message);
    }
}