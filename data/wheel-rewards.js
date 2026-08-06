// Nothing here but us soggies

import {
    publicRarityOrder,
    rarities
} from "/data/rarities.js";

export const wheelTypes = {
    balanced: {
        id: "balanced",
        name: "balanced",
        description: "reasonable odds. questionable decisions.",

        rarityChances: {
            common: 50,
            uncommon: 24,
            rare: 13,
            "super-rare": 6,
            epic: 3.8,
            mythic: 2,
            legendary: 1,
            "ultra-legendary": 0.2
        }
    },

    collector: {
        id: "collector",
        name: "collector",
        description: "better sog odds. soggies only.",

        rarityChances: {
            common: 35,
            uncommon: 25,
            rare: 18,
            "super-rare": 10,
            epic: 6,
            mythic: 3.5,
            legendary: 2,
            "ultra-legendary": 0.5
        }
    }
};

export function getWheelType(id = "balanced") {
    return wheelTypes[id] ?? wheelTypes.balanced;
}

export function rollRarity(wheelId = "balanced") {
    const wheel = getWheelType(wheelId);

    const entries = publicRarityOrder.map((rarityId) => ({
        rarityId,
        chance: wheel.rarityChances[rarityId] ?? 0
    }));

    const total = entries.reduce(
        (sum, entry) => sum + entry.chance,
        0
    );

    let roll = Math.random() * total;

    for (const entry of entries) {
        roll -= entry.chance;

        if (roll <= 0) {
            return entry.rarityId;
        }
    }

    return "common";
}

export function getRarityChance(
    wheelId,
    rarityId
) {
    const wheel = getWheelType(wheelId);

    return wheel.rarityChances[rarityId] ?? 0;
}
