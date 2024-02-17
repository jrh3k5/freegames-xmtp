// A descriptor of available metadata properties for an image.
export class Metadata {
    constructor(filename, mimeType, data) {
        this.filename = filename;
        this.mimeType = mimeType;
        this.data = data;
    }
}