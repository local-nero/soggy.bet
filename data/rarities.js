// This handles the rarities of the soggy sogginess

export const rarities = {
    common: {
        id: "common",
        name: "common",
        chance: 50,
        color: "#9ca3af",
        cutscene: false
    },

    uncommon: {
        id: "uncommon",
        name: "uncommon",
        chance: 24,
        color: "#4ade80",
        cutscene: false
    },

    rare: {
        id: "rare",
        name: "rare",
        chance: 13,
        color: "#3b82f6",
        cutscene: false
    },

    "super-rare": {
        id: "super-rare",
        name: "super rare",
        chance: 6,
        color: "#a855f7",
        cutscene: false
    },

    epic: {
        id: "epic",
        name: "epic",
        chance: 3.8,
        color: "#f97316",
        cutscene: false
    },

    mythic: {
        id: "mythic",
        name: "mythic",
        chance: 2,
        color: "#ef4444",
        cutscene: true,
        cutsceneType: "mythic"
    },

    legendary: {
        id: "legendary",
        name: "legendary",
        chance: 1,
        color: "#facc15",
        cutscene: true,
        cutsceneType: "legendary"
    },

    "ultra-legendary": {
        id: "ultra-legendary",
        name: "ultra-legendary",
        chance: 0.2,
        color: "#67e8f9",
        cutscene: true,
        cutsceneType: "ultra"
    }
};

export const publicRarityOrder = [
    "common",
    "uncommon",
    "rare",
    "super-rare",
    "epic",
    "mythic",
    "legendary",
    "ultra-legendary"
];

/*
    anomalies are intentionally not part of the public rarity table.

    they are not:
    - displayed in odds
    - displayed as a soggydex rarity
    - counted toward normal completion
    - rolled through the normal rarity system
*/
export const anomalyClassification = {
    id: "anomaly",
    name: "████████",
    color: "#ffffff",
    cutscene: true,
    cutsceneType: "anomaly"
};

export function getRarity(id) {
    if (id === "anomaly") {
        return anomalyClassification;
    }

    return rarities[id] ?? null;
}

export function formatChance(chance) {
    if (!Number.isFinite(chance)) {
        return "???";
    }

    if (chance >= 1) {
        return `${chance.toFixed(
            Number.isInteger(chance) ? 0 : 2
        )}%`;
    }

    return `${chance.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

export function chanceToOdds(chance) {
    if (!Number.isFinite(chance) || chance <= 0) {
        return "???";
    }

    const odds = Math.round(100 / chance);

    return `1 in ${odds.toLocaleString("en-US")}`;
}
