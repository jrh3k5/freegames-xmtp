import NodeCache from "node-cache";

// builds a new cache
export function newCache() {
    return new NodeCache({
        stdTTL: 30,
        maxKeys: 5000
    });
}