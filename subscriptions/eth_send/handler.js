export class Handler {
    constructor(subscriptionService, subscriptionDurationBlocks, minimumGwei) {
        this.subscriptionService = subscriptionService;
        this.subscriptionDurationBlocks = subscriptionDurationBlocks;
        this.minimumGwei = minimumGwei;
    }

    async handle(senderAddress, amount) {
        if (amount < this.minimumGwei) {
            return
        }

        console.log(`${senderAddress} sent ${amount} gwei and would be subscribed for ${this.subscriptionDurationBlocks} blocks`);

        await this.subscriptionService.upsertSubscription(senderAddress);
    }
}