import dotenv from "dotenv";
import { expect } from "chai";
import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import axios from "axios";

dotenv.config();

const sleep = async (waitMillis) => {
    await new Promise(resolve => setTimeout(resolve, waitMillis));
}

describe("bot subscription", () => {
    let xmtpClient;

    beforeEach(async () => {
        const signer = Wallet.createRandom();
        xmtpClient = await Client.create(signer, { env: "dev" });

        // Wait for the containers to be up and running
        await sleep(5000);
    })

    describe("subscribing", () => {
        it("successfully subscribes", async () => {
            const botSigner = new Wallet(process.env.XMTP_BOT_KEY);
            const botAddress = await botSigner.getAddress();

            const conversation = await xmtpClient.conversations.newConversation(botAddress);
            await conversation.send("subscribe");

            // Wait long enough for a response
            await sleep(1000);

            const getLastMessage = async () => {
                const messages = await conversation.messages({
                    limit: 100
                });
                const nonSenderMessages = messages.filter(m => m.senderAddress.toLowerCase() !== xmtpClient.address.toLowerCase());
                if (!nonSenderMessages.length) {
                    return null;
                }

                return `${nonSenderMessages[nonSenderMessages.length - 1].content}`;
            }

            await retry(async () => {
                const receivedMessage = await getLastMessage();
                if (!receivedMessage) {
                    console.debug("No message received yet, post-subscription");
                    return false;
                }

                console.debug("Received post-subscription message: ", receivedMessage);

                if (receivedMessage.indexOf("You are now subscribed") < 0) {
                    return false;
                }

                return true;
            });

            // Invoke the webhook
           await axios.post("http://localhost:12345/freestuffbot.xyz/webhook", {
                "event": "free_games", 
                "secret": "wdaji29dJadj91jAjd9a92eDak2",
                "data": [ 565940 ]
            }, {
                headers: {
                    "Accept": "application/json"
                }
            });

            await retry(async () => {
                const gameDealMessage = await getLastMessage();

                console.debug("Last-seen message after sending webhook request: ", gameDealMessage);

                if (!gameDealMessage || gameDealMessage.indexOf("Free game") < 0) {
                    return false;
                }

                expect(gameDealMessage).to.contain("Free game");
                expect(gameDealMessage).to.contain("https://redirect.freestuffbot.xyz"); // make sure that the store URL is passed along successfully

                return true;
            });
        })
    })
})

async function retry(testFn) {
    let retryCount = 0;
    const maxTries = 20;

    while(retryCount < maxTries) {
        retryCount++

        const succeeded = await testFn();
        if(succeeded) {
            break;
        }

        await sleep(500);
    }

    expect(retryCount).to.be.lessThan(maxTries);
}