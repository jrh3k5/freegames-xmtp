// Gets, if configured, the list of addresses that are to be allowed to subscribe.
export function getAllowList() {
    if (process.env.XMTP_BOT_SUBSCRIBE_ALLOWLIST) {
        return process.env.XMTP_BOT_SUBSCRIBE_ALLOWLIST.split(",").map(address => address.toLowerCase());
    }

    return null;
}