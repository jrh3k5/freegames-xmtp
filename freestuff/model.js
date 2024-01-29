export class GameDetails {
    constructor(gameID, gameTitle, gameDescription, url, originalPrice, store) {
        this.gameID = gameID;
        this.gameTitle = gameTitle;
        this.gameDescription = gameDescription;
        this.url = url;
        this.originalPrice = originalPrice;
        this.store = store;
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