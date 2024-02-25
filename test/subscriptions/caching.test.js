import { expect } from "chai";
import { CachingSubscriptionService } from "../../subscriptions/caching.js";

describe("Caching Subscriptions Service", () => {
    let cachedData;
    let subscribedAddresses;
    let service;

    beforeEach(() => {
        cachedData = {};
        subscribedAddresses = [];

        const delegateService = {};
        delegateService.isSubscribed = recipientAddress => {
            return Promise.resolve(subscribedAddresses.indexOf(recipientAddress) >= 0);
        }
        delegateService.unsubscribe = recipientAddress => {
            const addressIndex = subscribedAddresses.indexOf(recipientAddress);
            if (addressIndex >= 0) {
                subscribedAddresses.splice(addressIndex, 1);
            }
            return Promise.resolve();
        }
        delegateService.upsertSubscription = recipientAddress => {
            const addressIndex = subscribedAddresses.indexOf(recipientAddress);
            if (addressIndex < 0) {
                subscribedAddresses.push(recipientAddress);
            }

            return Promise.resolve();
        }

        const cache = {};
        cache.get = cacheKey => {
            return cachedData[cacheKey];
        }
        cache.set = (cacheKey, data) => {
            cachedData[cacheKey] = data;
        };
        cache.del = cacheKey => {
            cachedData[cacheKey] = undefined;
        }

        service = new CachingSubscriptionService(delegateService, cache);
    })

    describe("isSubscribed", () => {
        it("it caches the data and reuses the cache", async () => {
            const recipientAddress = "is.subscribed.cached";
            subscribedAddresses.push(recipientAddress);

            // Sanity check
            expect(cachedData[recipientAddress]).to.not.exist;

            const isSubscribed = await service.isSubscribed(recipientAddress);
            expect(isSubscribed).to.be.true;

            expect(cachedData["subscribed-" + recipientAddress]).to.equal(isSubscribed);

            // Remove the subscription - it should still come back as subscribed
            // because it's using the cached data
            subscribedAddresses.splice(0, 1);
            expect(subscribedAddresses).to.be.empty;

            expect(await service.isSubscribed(recipientAddress)).to.be.true;
        })
    })

    describe("unsubscribe", () => {
        it("deletes the cached data", async () => {
            const recipientAddress = "is.unsubscribed.cached";
            cachedData["subscribed-" + recipientAddress] = true;

            await service.unsubscribe(recipientAddress);

            expect(cachedData["subscribed-" + recipientAddress]).to.not.exist;
        })
    })

    describe("upsertSubscription", () => {
        describe("'true' is cached", () => {
            it("does not delete the cached data", async () => {
                const recipientAddress = "upsertSubscription.cached";
                cachedData["subscribed-" + recipientAddress] = true;

                await service.upsertSubscription(recipientAddress);
            
                expect(cachedData["subscribed-" + recipientAddress]).to.be.true;
            })
        })

        describe("'false' is cached", () => {
            it("deletes the cached data", async () => {
                const recipientAddress = "upsertSubscription.cached";
                cachedData["subscribed-" + recipientAddress] = false;

                await service.upsertSubscription(recipientAddress);
            
                expect(cachedData["subscribed-" + recipientAddress]).to.not.exist;
            })
        })
    })
})