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
        await this.cache.set(cacheKey, isSubscribed);
        return isSubscribed;
    }

    async getSubscriptions(cursor) {
        // deliberately not caching this
        return await this.delegateService.getSubscriptions(cursor);
    }

    async unsubscribe(recipientAddress) {
        await this.cache.del(`subscribed-${recipientAddress}`);
        return await this.delegateService.unsubscribe(recipientAddress);
    }

    async upsertSubscription(recipientAddress, subscriptionExpiryBlock) {
        const cacheKey = `subscribed-${recipientAddress}`;
        const cached = await this.cache.get(cacheKey);
        if (cached != undefined && !cached) {
            // only delete the cached data if we previously cached
            // that the user is not subscribed
            await this.cache.del(cacheKey);
        }
        return await this.delegateService.upsertSubscription(recipientAddress, subscriptionExpiryBlock);
    }
}