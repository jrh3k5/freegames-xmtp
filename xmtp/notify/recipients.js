// getDefaultRecipients gets the default recipients configured, if any.
export function getDefaultRecipients() {
    let defaultRecipients = [];
    if (process.env.XMTP_BOT_DEFAULT_RECIPIENTS) {
        defaultRecipients = process.env.XMTP_BOT_DEFAULT_RECIPIENTS.split(",");
    }
    return defaultRecipients;
}