export class ExpirationHandler {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
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

        // TODO: notify users that they've been unsubscribed
        const unsubscribePromises = toUnsubscribe.map(address => this.subscriptionsService.unsubscribe(address));
        await Promise.all(unsubscribePromises);

        return unsubscribePromises.length;
    }
}