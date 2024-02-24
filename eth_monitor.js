import dotenv from "dotenv";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";

dotenv.config();

const receiptAddress = (process.env.SUBSCRIPTION_RECEIPT_ADDRESS || "").toLowerCase();
if (!receiptAddress) {
    throw "A receipt address must be specified";
}

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network[process.env.ALCHEMY_NETWORK_ID]
};

if (!settings.apiKey) {
    throw "An Alchemy API key must be provided";
}

if (!settings.network) {
    throw "An invalid Alchemy network ID has been specified";
}

console.log(`Monitoring for ETH sends to address ${receiptAddress} on ${settings.network}`);

new Alchemy(settings).ws.on(
    {
        method: AlchemySubscription.MINED_TRANSACTIONS,
        addresses: [{ to: receiptAddress }]
    },
    res => {
        const sentGwei = parseInt(res.transaction.value, 16);
        console.log(`${res.transaction.from} sent ${sentGwei}`)
    }
);