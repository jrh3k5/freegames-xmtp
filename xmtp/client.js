import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";

// creates an XMTP client
export async function newClient(privateKey, environment, codecs) {
    const signer = new Wallet(privateKey);
    const xmtpClient = await Client.create(signer, { 
        env: environment,
        codecs: codecs || []
    });

    return xmtpClient;
}