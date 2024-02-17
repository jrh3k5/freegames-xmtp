// This is a wrapper implementation of Retriever used to provide caching.
export class CachingRetriever {
    constructor(delegateRetriever, cache) {
        this.delegateRetriever = delegateRetriever;
        this.cache = cache;
    }

    async getMetadata(imageURL) {
        const cacheKey = `image-metadata-${imageURL}`;

        const cached = await this.cache.get(cacheKey);
        if (cached != undefined) {
            return cached;
        }

        const imageMetadata = await this.delegateRetriever.getMetadata(imageURL);
        await this.cache.set(cacheKey, imageMetadata);
        return imageMetadata;
    }
}