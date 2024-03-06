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

                return nonSenderMessages[nonSenderMessages.length - 1].content;
            }

            expect(await getLastMessage()).to.contain("You are now subscribed");

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

            // Wait for the message to make its way through the system
            await sleep(2000);

            expect(await getLastMessage()).to.contain("Free game");
        })
    })
})