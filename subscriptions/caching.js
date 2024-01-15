export class CachingSubscriptionService {
    constructor(delegateService, cache) {
        this.delegateService = delegateService;
        this.cache = cache;
    }

    async isSubscribed(recipientAddress) {
        const cacheKey = `subscribed-${recipientAddress}`;

        const cached = this.cache.get(cacheKey);
        if (cached != undefined) {
            return cached;
        }

        const isSubscribed = await this.delegateService.isSubscribed(recipientAddress);
        this.cache.set(cacheKey, isSubscribed);
        return isSubscribed;
    }

    async getSubscriptions(cursor) {
        return await this.delegateService.getSubscriptions(cursor);
    }

    async unsubscribe(recipientAddress) {
        this.cache.del(`subscribed-${recipientAddress}`);
        return await this.delegateService.unsubscribe(recipientAddress);
    }

    async upsertSubscription(recipientAddress) {
        const cacheKey = `subscribed-${recipientAddress}`;
        const cached = this.cache.get(cacheKey);
        if (cached != undefined && !cached) {
            // only delete the cached data if we previously cached
            // that the user is not subscribed
            this.cache.del(recipientAddress);
        }
        return await this.delegateService.upsertSubscription(recipientAddress);
    }
}