import { expect } from "chai";
import { Notifier } from "../../../xmtp/notify/notifier.js";

describe("Notifier", () => {
    let xmtpClient;
    let sentMessages;
    let notifier;

    beforeEach(() => {
        sentMessages = [];

        xmtpClient = {};
        xmtpClient.conversations = {};
        xmtpClient.conversations.newConversation = async () => {
            const conversation = {};
            conversation.send = async (message) => {
                sentMessages.push(message);
            };
            return conversation;
        };

        notifier = new Notifier(xmtpClient);
    })

    describe("notify", () => {
        let gameDetails;

        beforeEach(() => {
            gameDetails = {};
            gameDetails.store = "steam";
            gameDetails.gameTitle = "This is a Free Game"
            gameDetails.originalPrice = "19.99"
            gameDetails.url = "https://free.game/?id=freegame"
        })

        it("notifies the user about the free game", async ()=> {
            const receipientAddress = "0x123456789";
            await notifier.notify(receipientAddress, gameDetails);

            expect(sentMessages).to.have.lengthOf(1);
            expect(sentMessages[0]).to.contain("Free game (originally $19.99):")
        })

        describe("there is no price", () => {
            beforeEach(() => {
                gameDetails.originalPrice = undefined;
            })

            it("does not include the 'free game' preamble", async () => {
                const receipientAddress = "0x987654321";
                await notifier.notify(receipientAddress, gameDetails);
    
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0]).to.not.contain("Free game (originally");
            })
        })
    })
})