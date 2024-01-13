export class Notifier {
    constructor(xmtpClient, recipientAddresses) {
        this.xmtpClient = xmtpClient;
        this.recipientAddresses = recipientAddresses;
    }

    notify(gameDetails) {
        this.recipientAddresses.forEach(receipientAddress => {
            // TODO: implement sending of messages
        })
    }
}