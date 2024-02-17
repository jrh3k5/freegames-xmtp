import { expect } from "chai";
import { CachingRetriever } from "../../../images/metadata/caching_retriever.js";

describe("Caching Retriever", () => {
    let retriever;
    let cachedData;
    let imageMetadata;

    beforeEach(() => {
        imageMetadata = {};
        cachedData = {};

        const delegateRetriever = {};
        delegateRetriever.getMetadata = async (imageURL) => {
            return imageMetadata[imageURL];
        }

        const cache = {};
        cache.get = async (cacheKey) => {
            return cachedData[cacheKey];
        };
        cache.set = async (cacheKey, data) => {
            cachedData[cacheKey] = data;
        };

        retriever = new CachingRetriever(delegateRetriever, cache);
    })

    describe("there is cached data", () => {
        it("returns the cached data", async () => {
            const imageURL = "https://test/cached.png";
            const cachedImageMetadata = {
                filename: "cached.png"
            }
            cachedData[`image-metadata-${imageURL}`] = cachedImageMetadata;

            const returnedData = await retriever.getMetadata(imageURL);
            expect(returnedData).to.equal(cachedImageMetadata);
        })
    })

    describe("there is no cached data", () => {
        it("does a live pull and caches the data", async () => {
            const imageURL = "https://test/live.png";
            const liveData = {
                filename: "live.png"
            };
            imageMetadata[imageURL] = liveData;

            const returnedData = await retriever.getMetadata(imageURL);
            expect(returnedData).to.equal(liveData);
            expect(cachedData[`image-metadata-${imageURL}`]).to.equal(liveData);
        })
    })
})