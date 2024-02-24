import { Metadata } from "./model.js";

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
            const dataBytes = new Uint8Array(Buffer.from(cached.dataBase64, "base64"));

            return new Metadata(cached.filename, cached.mimeType, dataBytes);;
        }

        const imageMetadata = await this.delegateRetriever.getMetadata(imageURL);

        const cachedMetadata = {
            filename: imageMetadata.filename,
            mimeType: imageMetadata.mimeType,
            dataBase64: Buffer.from(imageMetadata.data).toString("base64")
        };
        await this.cache.set(cacheKey, cachedMetadata);
        
        return imageMetadata;
    }
}