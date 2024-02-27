export class ExpirationHandler {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }

    async deactivateExpiredSubscriptions(expiryBlockThreshold) {
        let page = await subscriptionsRepo.getSubscriptionAddresses({
            expiryThreshold: expiryBlockThreshold
        });
        
        if (!page.receipientAddresses.length) {
            return;
        }

        const toUnsubscribe = [];
        do {
            page.receipientAddresses.forEach(address => toUnsubscribe.push(address));

            page = await subscriptionsRepo.getSubscriptionAddresses({
                cursor: page.cursor,
                expiryThreshold: expiryBlockThreshold
            });
        } while(page.receipientAddresses.length && page.cursor);

        const unsubscribePromises = toUnsubscribe.map(address => this.subscriptionsService.unsubscribe(address));
        await Promise.all(unsubscribePromises);
    }
}