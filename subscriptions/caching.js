export class CachingSubscriptionService {
    constructor(delegateService, cache) {
        this.delegateService = delegateService;
        this.cache = cache;
    }

    async isSubscribed(recipientAddress) {
        if (!recipientAddress) {
            return
        }

        const cacheKey = `subscribed-${recipientAddress.toLowerCase()}`;

        const cached = this.cache.get(cacheKey);
        if (cached != undefined) {
            return cached;
        }

        const isSubscribed = await this.delegateService.isSubscribed(recipientAddress);
        await this.cache.set(cacheKey, isSubscribed);
        return isSubscribed;
    }

    async getSubscriptionAddresses(options) {
        // deliberately not caching this
        return await this.delegateService.getSubscriptionAddresses(options);
    }

    async unsubscribe(recipientAddress) {
        if (!recipientAddress) {
            return
        }

        await this.cache.del(`subscribed-${recipientAddress.toLowerCase()}`);
        return await this.delegateService.unsubscribe(recipientAddress);
    }

    async upsertSubscription(recipientAddress, subscriptionExpiryBlock) {
        if (!recipientAddress) {
            throw "A receipient address must be supplied when upserting a subscription";
        }

        const cacheKey = `subscribed-${recipientAddress.toLowerCase()}`;
        const cached = await this.cache.get(cacheKey);
        if (cached != undefined && !cached) {
            // only delete the cached data if we previously cached
            // that the user is not subscribed
            await this.cache.del(cacheKey);
        }
        return await this.delegateService.upsertSubscription(recipientAddress, subscriptionExpiryBlock);
    }
}