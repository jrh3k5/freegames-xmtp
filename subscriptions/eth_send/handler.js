export class Handler {
    constructor(subscriptionService, subscriptionDurationBlocks, minimumGwei, xmtpClient) {
        this.subscriptionService = subscriptionService;
        this.subscriptionDurationBlocks = subscriptionDurationBlocks;
        this.minimumGwei = minimumGwei;
        this.xmtpClient = xmtpClient;
    }

    async handle(senderAddress, blockNumber, amount) {
        if (amount < this.minimumGwei) {
            return
        }

        console.log(`${senderAddress} sent ${amount} gwei and would be subscribed for ${this.subscriptionDurationBlocks} blocks`);

        await this.subscriptionService.upsertSubscription(senderAddress, blockNumber + this.subscriptionDurationBlocks);

        const conversation = await this.xmtpClient.conversations.newConversation(senderAddress);
        const salutation = `Welcome to the free games XMTP bot! Your subscription will last until block ${blockNumber}`;
        await conversation.send(salutation);
    }
}