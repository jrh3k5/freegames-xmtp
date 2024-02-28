export class Handler {
    constructor(subscriptionService, subscriptionDurationBlocks, minimumWei, xmtpClient) {
        this.subscriptionService = subscriptionService;
        this.subscriptionDurationBlocks = subscriptionDurationBlocks;
        this.minimumWei = minimumWei;
        this.xmtpClient = xmtpClient;
    }

    async handle(senderAddress, blockNumber, amount) {
        if (amount < this.minimumWei) {
            return
        }

        await this.subscriptionService.upsertSubscription(senderAddress, blockNumber + this.subscriptionDurationBlocks);

        const conversation = await this.xmtpClient.conversations.newConversation(senderAddress);
        const salutation = `Welcome to the free games XMTP bot! Your subscription will last until block ${blockNumber}`;
        await conversation.send(salutation);
    }
}