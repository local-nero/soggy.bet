// creates, loads, updates, resets, and saves player data in localStorage *completely local for now*

const STORAGE_KEY = "soggybet_player";

const DEFAULT_PLAYER = {
    username: "Guest",
    balance: 10000,
    inventory: [],
    statistics: {
        totalWagered: 0,
        totalWon: 0,
        wheelSpins: 0,
        catsCollected: 0,
        catsSold: 0
    },
    settings: {
        sound: true,
        animations: true,
        reducedMotion: false
    },
    touchGrass: {
        lastTouched: null
    }
};

function cloneDefaultPlayer() {
    return JSON.parse(JSON.stringify(DEFAULT_PLAYER));
}

function mergePlayerData(savedPlayer) {
    const defaults = cloneDefaultPlayer();

    return {
        ...defaults,
        ...savedPlayer,

        statistics: {
            ...defaults.statistics,
            ...(savedPlayer?.statistics ?? {})
        },

        settings: {
            ...defaults.settings,
            ...(savedPlayer?.settings ?? {})
        },

        touchGrass: {
            ...defaults.touchGrass,
            ...(savedPlayer?.touchGrass ?? {})
        },

        inventory: Array.isArray(savedPlayer?.inventory)
            ? savedPlayer.inventory
            : []
    };
}

export function getPlayer() {
    const rawPlayer = localStorage.getItem(STORAGE_KEY);

    if (!rawPlayer) {
        const newPlayer = cloneDefaultPlayer();
        savePlayer(newPlayer);
        return newPlayer;
    }

    try {
        return mergePlayerData(JSON.parse(rawPlayer));
    } catch (error) {
        console.error("Failed to read SoggyBet player data:", error);

        const recoveredPlayer = cloneDefaultPlayer();
        savePlayer(recoveredPlayer);

        return recoveredPlayer;
    }
}

export function savePlayer(player) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(mergePlayerData(player))
    );

    window.dispatchEvent(
        new CustomEvent("soggybet:player-updated", {
            detail: player
        })
    );
}

export function updatePlayer(updater) {
    const player = getPlayer();
    const updatedPlayer = updater(player) ?? player;

    savePlayer(updatedPlayer);

    return updatedPlayer;
}

export function resetPlayer() {
    const player = cloneDefaultPlayer();
    savePlayer(player);

    return player;
}
