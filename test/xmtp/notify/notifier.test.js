import { expect } from "chai";
import { Notifier } from "../../../xmtp/notify/notifier.js";
import { ContentTypeAttachment } from "@xmtp/content-type-remote-attachment";

describe("Notifier", () => {
    let xmtpClient;
    let imageMetadataRetriever;
    let sentMessages;
    let notifier;
    let imageMetadata;

    beforeEach(() => {
        sentMessages = [];
        imageMetadata = {};

        xmtpClient = {};
        xmtpClient.conversations = {};
        xmtpClient.conversations.newConversation = async () => {
            const conversation = {};
            conversation.send = async (message, options) => {
                sentMessages.push({
                    messageContent: message,
                    options: options
                });
            };
            return conversation;
        };

        imageMetadataRetriever = {};
        imageMetadataRetriever.getMetadata = async (imageURL) => {
            return imageMetadata[imageURL];
        }

        notifier = new Notifier(xmtpClient, imageMetadataRetriever);
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
            expect(sentMessages[0].messageContent).to.contain("Free game (originally $19.99):")
        })

        describe("there is no price", () => {
            beforeEach(() => {
                gameDetails.originalPrice = undefined;
            })

            it("does not include the 'free game' preamble", async () => {
                const receipientAddress = "0x987654321";
                await notifier.notify(receipientAddress, gameDetails);
    
                expect(sentMessages).to.have.lengthOf(1);
                expect(sentMessages[0].messageContent).to.not.contain("Free game (originally");
            })
        })

        describe("there is an image URL", () => {
            let imageMetadatum;

            beforeEach(() => {
                const imageURL = "http://game.img/thumb.png";

                imageMetadatum = {
                    filename: "game_image.png",
                }

                gameDetails.imageURL = imageURL;
                imageMetadata[imageURL] = imageMetadatum
            })

            it("sends out the image as a content attachment first", async () => {
                const receipientAddress = "0x246810";
                await notifier.notify(receipientAddress, gameDetails);

                expect(sentMessages).to.have.lengthOf(2);
                expect(sentMessages[0].messageContent).to.equal(imageMetadatum);
                expect(sentMessages[0].options.contentType).to.equal(ContentTypeAttachment);
            })
        })
    })
})