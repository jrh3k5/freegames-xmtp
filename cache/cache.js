import NodeCache from "node-cache";

// builds a new cache
export function newCache(cacheTTL, maxKeys) {
    return new NodeCache({
        stdTTL: cacheTTL || 30,
        maxKeys: maxKeys || 5000
    });
}