import axios from "axios";
import { Metadata } from "./model.js";

// TODO: add caching
export class Retriever {
    // Retrieves the image metadata as a Metadata object.
    async getMetadata(imageURL) {
        const imageResponse = await axios.get(imageURL, {
            responseType: 'arraybuffer'
        });

        const filename = new URL(imageURL).pathname.split('/').pop()
        const contentType = imageResponse.headers.get("Content-Type");
        const data = new Uint8Array(imageResponse.data)

        return new Metadata(filename, contentType, data)
    }
}