import { expect } from "chai";
import { CachingRetriever } from "../../../images/metadata/caching_retriever.js";
import { Metadata } from "../../../images/metadata/model.js";
import { newCache } from "../../../cache/cache.js";

describe("Caching Retriever", () => {
    let retriever;
    let imageMetadata;

    beforeEach(() => {
        imageMetadata = {};

        const delegateRetriever = {};
        delegateRetriever.getMetadata = async (imageURL) => {
            return imageMetadata[imageURL];
        }
        
        const cache = newCache();
        retriever = new CachingRetriever(delegateRetriever, cache);
    })

    describe("there is no cached data", () => {
        it("does a live pull and caches the data", async () => {
            const imageURL = "https://test/live.png";
            const liveData = new Metadata("live.png", "image/png", new Uint8Array([65, 66, 67, 68]));
            imageMetadata[imageURL] = liveData;

            const returnedData = await retriever.getMetadata(imageURL);
            expect(returnedData.filename).to.equal("live.png");
            expect(returnedData.mimeType).to.equal("image/png");
            expect(Buffer.from(returnedData.data).toString("base64")).to.equal("QUJDRA==");

            // "Eliminate" the data from a live pull to ensure that a second pull retrieves the cached data
            imageMetadata[imageURL] = undefined;

            const cachedData = await retriever.getMetadata(imageURL);
            expect(cachedData.filename).to.equal("live.png");
            expect(cachedData.mimeType).to.equal("image/png");
            expect(Buffer.from(cachedData.data).toString("base64")).to.equal("QUJDRA==");

        })
    })
})