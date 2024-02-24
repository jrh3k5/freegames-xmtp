export async function run(xmtpClient, handler) {
    console.log(`Listening on ${xmtpClient.address}`);

    for await (const message of await xmtpClient.conversations.streamAllMessages()) {
        try {
            if (message.senderAddress == xmtpClient.address) {
                continue;
            }

            console.log("Got a message", message);

            await handler(message);
        } catch (e) {
            console.log(`error`, e, message);
        }
    }
}