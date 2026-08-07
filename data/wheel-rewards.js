// soggybet wheel configuration
// every visible wheel segment is a soggy rarity.
// no direct coin rewards here — the soggy itself is the reward.
// fully reworked now though

import {
    publicRarityOrder
} from "/data/rarities.js";


/* =========================================================
   wheel types
   ========================================================= */

export const wheelTypes = {
    balanced: {
        id: "balanced",
        name: "balanced",

        description:
            "reasonable odds. questionable decisions.",

        costMultiplier: 1,

        rarityChances: {
            common: 45,
            uncommon: 25,
            rare: 13,
            "super-rare": 7,
            epic: 5,
            legendary: 2.8,
            mythic: 2,
            "ultra-legendary": 0.2
        }
    },


    collector: {
        id: "collector",
        name: "collector",

        description:
            "better odds for rarer sogs.",

        costMultiplier: 1.25,

        rarityChances: {
            common: 35,
            uncommon: 25,
            rare: 17,
            "super-rare": 10,
            epic: 6,
            legendary: 4,
            mythic: 2.5,
            "ultra-legendary": 0.5
        }
    },


    risky: {
        id: "risky",
        name: "risky",

        description:
            "less common. considerably more stupid.",

        costMultiplier: 1.5,

        rarityChances: {
            common: 25,
            uncommon: 22,
            rare: 18,
            "super-rare": 14,
            epic: 9,
            legendary: 6,
            mythic: 4.5,
            "ultra-legendary": 1.5
        }
    },


    jackpot: {
        id: "jackpot",
        name: "jackpot",

        description:
            "financially irresponsible sog acquisition.",

        costMultiplier: 2,

        rarityChances: {
            common: 15,
            uncommon: 18,
            rare: 19,
            "super-rare": 17,
            epic: 12,
            legendary: 9,
            mythic: 7,
            "ultra-legendary": 3
        }
    }
};


/* =========================================================
   wager options
   ========================================================= */

export const wagerOptions = [
    100,
    500,
    1000,
    2500,
    5000,
    10000
];


/* =========================================================
   anomalies
   ========================================================= */

/*
    anomalies are completely separate from the visible wheel.

    0.002 = 0.002%
    approximately 1 in 50,000.
*/

export const anomalyConfig = {
    enabled: true,

    baseChance: 0.002,

    wheelMultipliers: {
        balanced: 1,
        collector: 1,
        risky: 1.25,
        jackpot: 1.5
    }
};


/* =========================================================
   wheel helpers
   ========================================================= */

export function getWheelType(
    wheelId = "balanced"
) {
    return (
        wheelTypes[wheelId] ??
        wheelTypes.balanced
    );
}


export function getAllWheelTypes() {
    return Object.values(
        wheelTypes
    );
}


export function isValidWheelType(
    wheelId
) {
    return Boolean(
        wheelTypes[wheelId]
    );
}


/* =========================================================
   spin cost
   ========================================================= */

export function getSpinCost(
    wheelId,
    wager
) {
    const wheel =
        getWheelType(
            wheelId
        );

    const numericWager =
        Number(wager);

    if (
        !Number.isFinite(
            numericWager
        ) ||
        numericWager <= 0
    ) {
        return 0;
    }

    return Math.round(
        numericWager *
        wheel.costMultiplier
    );
}


/* =========================================================
   rarity roll
   ========================================================= */

export function rollRarity(
    wheelId = "balanced"
) {
    const wheel =
        getWheelType(
            wheelId
        );

    const entries =
        publicRarityOrder.map(
            (rarityId) => ({
                rarityId,

                chance:
                    Number(
                        wheel.rarityChances[
                            rarityId
                        ] ?? 0
                    )
            })
        );

    const total =
        entries.reduce(
            (
                sum,
                entry
            ) =>
                sum +
                entry.chance,
            0
        );

    if (total <= 0) {
        return "common";
    }

    let roll =
        Math.random() *
        total;

    for (
        const entry
        of entries
    ) {
        roll -=
            entry.chance;

        if (roll <= 0) {
            return entry.rarityId;
        }
    }

    return "common";
}


/* =========================================================
   rarity odds
   ========================================================= */

export function getRarityChance(
    wheelId,
    rarityId
) {
    const wheel =
        getWheelType(
            wheelId
        );

    return Number(
        wheel.rarityChances[
            rarityId
        ] ?? 0
    );
}


export function getRarityChances(
    wheelId
) {
    const wheel =
        getWheelType(
            wheelId
        );

    return {
        ...wheel.rarityChances
    };
}


/* =========================================================
   anomaly system
   ========================================================= */

export function getAnomalyChance(
    wheelId = "balanced"
) {
    if (
        !anomalyConfig.enabled
    ) {
        return 0;
    }

    const multiplier =
        anomalyConfig
            .wheelMultipliers[
                wheelId
            ] ?? 1;

    return (
        anomalyConfig.baseChance *
        multiplier
    );
}


export function rollAnomaly(
    wheelId = "balanced"
) {
    const chance =
        getAnomalyChance(
            wheelId
        );

    if (chance <= 0) {
        return false;
    }

    return (
        Math.random() *
        100
    ) < chance;
}


/* =========================================================
   individual soggy odds
   ========================================================= */

/*
    if mythic is 2%
    and there are 10 mythics:

    each mythic = 0.2%
*/

export function getIndividualSoggyChance(
    wheelId,
    rarityId,
    poolSize
) {
    if (
        !Number.isFinite(
            poolSize
        ) ||
        poolSize <= 0
    ) {
        return null;
    }

    const rarityChance =
        getRarityChance(
            wheelId,
            rarityId
        );

    if (rarityChance <= 0) {
        return null;
    }

    return (
        rarityChance /
        poolSize
    );
}


/* =========================================================
   chance formatting
   ========================================================= */

export function chanceToOdds(
    chance
) {
    if (
        !Number.isFinite(
            chance
        ) ||
        chance <= 0
    ) {
        return null;
    }

    return Math.round(
        100 /
        chance
    );
}


export function formatChance(
    chance
) {
    if (
        !Number.isFinite(
            chance
        ) ||
        chance <= 0
    ) {
        return "???";
    }

    if (chance >= 1) {
        return (
            Number(
                chance.toFixed(2)
            ) + "%"
        );
    }

    if (chance >= 0.01) {
        return (
            Number(
                chance.toFixed(4)
            ) + "%"
        );
    }

    return (
        Number(
            chance.toFixed(6)
        ) + "%"
    );
}


export function formatOdds(
    chance
) {
    const odds =
        chanceToOdds(
            chance
        );

    if (!odds) {
        return "???";
    }

    return (
        "1 in " +
        odds.toLocaleString(
            "en-US"
        )
    );
}


/* =========================================================
   wheel ui data
   ========================================================= */

export function getWheelDisplayData(
    wheelId
) {
    const wheel =
        getWheelType(
            wheelId
        );

    return {
        id:
            wheel.id,

        name:
            wheel.name,

        description:
            wheel.description,

        costMultiplier:
            wheel.costMultiplier,

        rarityChances: {
            ...wheel.rarityChances
        }
    };
}


/* =========================================================
   validation
   ========================================================= */

export function validateWheelConfig() {
    const problems = [];

    for (
        const wheel
        of Object.values(
            wheelTypes
        )
    ) {
        const rarityTotal =
            Object.values(
                wheel.rarityChances
            ).reduce(
                (
                    sum,
                    chance
                ) =>
                    sum +
                    Number(chance),
                0
            );

        if (
            Math.abs(
                rarityTotal -
                100
            ) >
            0.001
        ) {
            problems.push(
                `${wheel.id}: rarity chances total ${rarityTotal}% instead of 100%.`
            );
        }
    }

    return {
        valid:
            problems.length === 0,

        problems
    };
}
