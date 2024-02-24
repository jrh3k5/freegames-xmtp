export class Handler {
    constructor(subscriptionDurationBlocks, minimumGwei) {
        this.subscriptionDurationBlocks = subscriptionDurationBlocks;
        this.minimumGwei = minimumGwei;
    }

    async handle(senderAddress, amount) {
        if (amount < this.minimumGwei) {
            return
        }

        console.log(`${senderAddress} sent ${amount} gwei and would be subscribed for ${this.subscriptionDurationBlocks} blocks`);
    }
}