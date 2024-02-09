import axios from "axios";
import { GameDetails } from "./model.js";

// A client used to interact with the freestuffbot.xyz API.
export class FreestuffClient {
    // Creates a new client.
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    // GetGameDetails looks up the game details for the given game ID.
    // This returns a GameDetails object.
    async getGameDetails(gameID) {
        if (!Number.isInteger(gameID)) {
            throw 'game ID must be an integer';
        }

        const response = await axios({
            url: `https://api.freestuffbot.xyz/v1/game/${gameID}/info`,
            method: "get",
            headers: {
                "Accept": "application/json",
                "Authorization": `Basic ${this.apiKey}`
            }
        });

        if(!response.data) {
            throw `no data found on response for game ID ${gameID}`;
        } else if (!response.data.success) {
            throw `unexpected failure calling info for game ID ${gameID}`;
        }
        
        const gameDetails = response.data.data[gameID];
        if (!gameDetails) {
            throw `no game details found in response for game ID ${gameID}`;
        }
        
        const gameTitle = gameDetails.title;
        const gameDescription = gameDetails.description;
        const gameURL = gameDetails.urls.default;
        const originalPrice = gameDetails["org_price"].dollar;
        const store = gameDetails.store;
        const currentPrice = gameDetails["price"].dollar;

        return new GameDetails(`${gameID}`, gameTitle, gameDescription, gameURL, originalPrice, store, currentPrice);
    }
}