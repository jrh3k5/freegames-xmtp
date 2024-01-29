import axios from "axios";
import { GameDetails } from "./model.js";

// A client used to interact with the freestuffbot.xyz API.
export class FreestuffClient {
    // Creates a new client.
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    // GetGameDetails looks up the game details for the given game ID.
    // This returns a Promise that either resolves to a GameDetails object or any error that occurred.
    getGameDetails(gameID) {
        const apiKey = this.apiKey;
        return new Promise((resolve, reject) => {
            axios({
                url: `https://api.freestuffbot.xyz/v1/game/${gameID}/info`,
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Basic ${apiKey}`
                }
            }).then(response => {
                if(!response.data) {
                    reject(`no data found on response for game ID ${gameID}`);
                } else if (!response.data.success) {
                    reject(`unexpected failure calling info for game ID ${gameID}`);
                } else {
                    const gameDetails = response.data.data[gameID];
                    if (!gameDetails) {
                        reject(`no game details found in response for game ID ${gameID}`);
                    }
                    
                    const gameTitle = gameDetails.title;
                    const gameDescription = gameDetails.description;
                    const gameURL = gameDetails.urls.default;
                    const originalPrice = gameDetails["org_price"].dollar;
                    const store = gameDetails.store;

                    resolve(new GameDetails(`${gameID}`, gameTitle, gameDescription, gameURL, originalPrice, store));
                }
            }).catch(reject);
        });
    }
}