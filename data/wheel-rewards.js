// coding is so fun

import {
    publicRarityOrder
} from "/data/rarities.js";

/*
    wheel types

    each wheel defines:
    - name
    - description
    - whether it can give soggycoins
    - rarity distribution
    - cost multiplier
    - optional coin rewards
*/

export const wheelTypes = {
    balanced: {
        id: "balanced",
        name: "balanced",
        description: "reasonable odds. questionable decisions.",

        costMultiplier: 1,

        rewards: {
            soggies: true,
            coins: true
        },

        rarityChances: {
            common: 50,
            uncommon: 24,
            rare: 13,
            "super-rare": 6,
            epic: 3.8,
            mythic: 2,
            legendary: 1,
            "ultra-legendary": 0.2
        },

        coinRewards: [
            {
                amountMultiplier: 0.5,
                weight: 50
            },

            {
                amountMultiplier: 1,
                weight: 30
            },

            {
                amountMultiplier: 2,
                weight: 15
            },

            {
                amountMultiplier: 5,
                weight: 5
            }
        ],

        soggyChance: 80,
        coinChance: 20
    },

    collector: {
        id: "collector",
        name: "collector",
        description: "better sog odds. soggies only.",

        costMultiplier: 1.25,

        rewards: {
            soggies: true,
            coins: false
        },

        rarityChances: {
            common: 35,
            uncommon: 25,
            rare: 18,
            "super-rare": 10,
            epic: 6,
            mythic: 3.5,
            legendary: 2,
            "ultra-legendary": 0.5
        },

        coinRewards: [],

        soggyChance: 100,
        coinChance: 0
    },

    risky: {
        id: "risky",
        name: "risky",
        description: "more pain. more moisture.",

        costMultiplier: 1.5,

        rewards: {
            soggies: true,
            coins: true
        },

        rarityChances: {
            common: 30,
            uncommon: 24,
            rare: 18,
            "super-rare": 12,
            epic: 7,
            mythic: 4.5,
            legendary: 3,
            "ultra-legendary": 1.5
        },

        coinRewards: [
            {
                amountMultiplier: 0,
                weight: 55
            },

            {
                amountMultiplier: 1,
                weight: 20
            },

            {
                amountMultiplier: 3,
                weight: 15
            },

            {
                amountMultiplier: 8,
                weight: 8
            },

            {
                amountMultiplier: 20,
                weight: 2
            }
        ],

        soggyChance: 65,
        coinChance: 35
    },

    jackpot: {
        id: "jackpot",
        name: "jackpot",
        description: "mostly despair. occasionally incredible.",

        costMultiplier: 2,

        rewards: {
            soggies: true,
            coins: true
        },

        rarityChances: {
            common: 20,
            uncommon: 20,
            rare: 20,
            "super-rare": 15,
            epic: 10,
            mythic: 7,
            legendary: 5,
            "ultra-legendary": 3
        },

        coinRewards: [
            {
                amountMultiplier: 0,
                weight: 70
            },

            {
                amountMultiplier: 1,
                weight: 10
            },

            {
                amountMultiplier: 5,
                weight: 8
            },

            {
                amountMultiplier: 10,
                weight: 6
            },

            {
                amountMultiplier: 25,
                weight: 4
            },

            {
                amountMultiplier: 100,
                weight: 2
            }
        ],

        soggyChance: 45,
        coinChance: 55
    }
};

/*
    base wager options

    the actual spin cost is:
    wager × wheel costMultiplier
*/

export const wagerOptions = [
    100,
    500,
    1000,
    2500,
    5000,
    10000
];

/*
    anomaly system

    this is intentionally separate from normal rarity rolls.

    chance is expressed as a percentage:
    0.002 = 0.002%
    approximately 1 in 50,000
*/

export const anomalyConfig = {
    enabled: true,

    baseChance: 0.002,

    /*
        wheel-specific multipliers

        these are hidden from the public odds ui
    */
    wheelMultipliers: {
        balanced: 1,
        collector: 1,
        risky: 1.25,
        jackpot: 1.5
    }
};

/*
    get a wheel config
*/

export function getWheelType(
    wheelId = "balanced"
) {
    return wheelTypes[wheelId]
        ?? wheelTypes.balanced;
}

/*
    return every wheel
*/

export function getAllWheelTypes() {
    return Object.values(
        wheelTypes
    );
}

/*
    check whether a wheel exists
*/

export function isValidWheelType(
    wheelId
) {
    return Boolean(
        wheelTypes[wheelId]
    );
}

/*
    get final spin cost
*/

export function getSpinCost(
    wheelId,
    wager
) {
    const wheel = getWheelType(
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

/*
    roll whether this spin gives:
    - a soggy
    - soggycoins
*/

export function rollRewardType(
    wheelId = "balanced"
) {
    const wheel = getWheelType(
        wheelId
    );

    if (
        wheel.rewards.soggies &&
        !wheel.rewards.coins
    ) {
        return "soggy";
    }

    if (
        wheel.rewards.coins &&
        !wheel.rewards.soggies
    ) {
        return "coins";
    }

    const total =
        wheel.soggyChance +
        wheel.coinChance;

    let roll =
        Math.random() *
        total;

    if (
        roll <
        wheel.soggyChance
    ) {
        return "soggy";
    }

    return "coins";
}

/*
    roll a rarity from a wheel's distribution
*/

export function rollRarity(
    wheelId = "balanced"
) {
    const wheel = getWheelType(
        wheelId
    );

    const entries =
        publicRarityOrder.map(
            (rarityId) => ({
                rarityId,

                chance:
                    wheel
                        .rarityChances[
                            rarityId
                        ] ?? 0
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

/*
    get public rarity chance
    for one wheel
*/

export function getRarityChance(
    wheelId,
    rarityId
) {
    const wheel = getWheelType(
        wheelId
    );

    return Number(
        wheel
            .rarityChances[
                rarityId
            ] ?? 0
    );
}

/*
    get all rarity chances
    for one wheel
*/

export function getRarityChances(
    wheelId
) {
    const wheel = getWheelType(
        wheelId
    );

    return {
        ...wheel.rarityChances
    };
}

/*
    coin reward picker

    returns a multiplier,
    not the final amount
*/

export function rollCoinMultiplier(
    wheelId = "balanced"
) {
    const wheel = getWheelType(
        wheelId
    );

    const rewards =
        wheel.coinRewards ?? [];

    if (
        rewards.length === 0
    ) {
        return 0;
    }

    const totalWeight =
        rewards.reduce(
            (
                total,
                reward
            ) =>
                total +
                reward.weight,
            0
        );

    if (totalWeight <= 0) {
        return 0;
    }

    let roll =
        Math.random() *
        totalWeight;

    for (
        const reward
        of rewards
    ) {
        roll -=
            reward.weight;

        if (roll <= 0) {
            return (
                reward
                    .amountMultiplier
                ?? 0
            );
        }
    }

    return (
        rewards[0]
            ?.amountMultiplier
        ?? 0
    );
}

/*
    calculate final coin reward
*/

export function rollCoinReward(
    wheelId,
    wager
) {
    const multiplier =
        rollCoinMultiplier(
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
        return {
            amount: 0,
            multiplier: 0
        };
    }

    return {
        amount:
            Math.round(
                numericWager *
                multiplier
            ),

        multiplier
    };
}

/*
    anomaly chance for a wheel
*/

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

/*
    hidden anomaly roll
*/

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

/*
    convert a percentage
    into 1 in x odds

    example:
    0.2%
    -> 1 in 500
*/

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

/*
    get one specific soggy's
    chance for a wheel

    rarityChance / poolSize

    example:

    ultra-legendary:
    0.2%

    9 wheel soggies:
    0.022222...%
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

/*
    formatted chance
*/

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

/*
    formatted odds
*/

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

/*
    get display data
    for a wheel selection ui
*/

export function getWheelDisplayData(
    wheelId
) {
    const wheel = getWheelType(
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

        hasSoggies:
            wheel
                .rewards
                .soggies,

        hasCoins:
            wheel
                .rewards
                .coins,

        rarityChances: {
            ...wheel
                .rarityChances
        }
    };
}

/*
    basic configuration validation

    useful during development
*/

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
                wheel
                    .rarityChances
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
            ) > 0.001
        ) {
            problems.push(
                `${wheel.id}: rarity chances total ${rarityTotal}% instead of 100%.`
            );
        }

        if (
            wheel
                .rewards
                .soggies &&
            wheel
                .rewards
                .coins
        ) {
            const rewardTypeTotal =
                wheel.soggyChance +
                wheel.coinChance;

            if (
                Math.abs(
                    rewardTypeTotal -
                    100
                ) > 0.001
            ) {
                problems.push(
                    `${wheel.id}: soggy/coin chances total ${rewardTypeTotal}% instead of 100%.`
                );
            }
        }
    }

    return {
        valid:
            problems.length === 0,

        problems
    };
}
