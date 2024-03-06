// This is a special value to provide a non-blank image URL to SQS while allowing it to be understood
// if a usable image URL was actually provided.
export const NoGameImageURL = "no_game_image_supplied";

export class GameDetails {
    constructor(gameID, gameTitle, gameDescription, url, originalPrice, store, currentPrice, imageURL, expiryDate, kind) {
        this.gameID = gameID;
        this.gameTitle = gameTitle;
        this.gameDescription = gameDescription;
        this.storeURL = url;
        this.originalPrice = originalPrice;
        this.store = store;
        this.currentPrice = currentPrice;
        this.imageURL = imageURL || NoGameImageURL;
        this.expiryDate = expiryDate;
        this.kind = kind;
    }
}

// getHumanReadableStoreName gets the human-readable name for the given
// FreeStuff store enum value
export function getHumanReadableStoreName(store) {
    if (!store) {
        return ""
    }

    // see: https://redirect.freestuffbot.xyz/game/Asdq
    switch (store.toLowerCase()) {
        case "apple":
            return "Apple App Store"
        case "discord":
            return "Discord"
        case "epic":
            return "Epic Games"
        case "gog":
            return "GOG"
        case "google":
            return "Google Play Store"
        case "humble":
            return "Humble Bundle"
        case "itch":
            return "itch.io"
        case "origin":
            return "Origin"
        case "ps":
            return "PlayStation"
        case "steam":
            return "Steam"
        case "switch":
            return "Nintendo Store"
        case "twitch":
            return "Twitch"
        case "uplay":
            return "uPlay"
        case "xbox":
            return "X-Box"
        default:
            return store
    }
}