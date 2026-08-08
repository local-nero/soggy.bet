// soggybet wheel configuration

import {
    publicRarityOrder
} from "/data/rarities.js";


/* =========================================================
   config
   ========================================================= */

export const MAX_WAGER_BOOST_AT =
    10000;

export const MAX_WAGER_BOOST =
    1;


/* =========================================================
   wheel types
   ========================================================= */

export const wheelTypes = {

    balanced: {

        id:
            "balanced",

        name:
            "balanced",

        description:
            "reasonable odds. questionable decisions.",

minWager:
    500,

maxBoostExtra:
    10000,

boostsEnabled:
    true,
        
        costMultiplier:
            1,

        nothingChance:
            0,

        boostsEnabled:
            true,

        allowedRarities: [
            "common",
            "uncommon",
            "rare",
            "super-rare",
            "epic",
            "legendary",
            "mythic",
            "ultra-legendary"
        ],

        rarityChances: {

            common:
                45,

            uncommon:
                25,

            rare:
                13,

            "super-rare":
                7,

            epic:
                5,

            legendary:
                2.8,

            mythic:
                2,

            "ultra-legendary":
                0.2

        }

    },


    collector: {

        id:
            "collector",

        name:
            "collector",

        description:
            "the whole soggydex is technically on the table.",

minWager:
    5000,

maxBoostExtra:
    15000,

boostsEnabled:
    true,

        costMultiplier:
            1,

        nothingChance:
            0,

        boostsEnabled:
            true,

        allowedRarities: [
            "common",
            "uncommon",
            "rare",
            "super-rare",
            "epic",
            "legendary",
            "mythic",
            "ultra-legendary"
        ],

        rarityChances: {

            common:
                31,

            uncommon:
                24,

            rare:
                18,

            "super-rare":
                11,

            epic:
                7,

            legendary:
                5,

            mythic:
                3.25,

            "ultra-legendary":
                0.75

        }

    },


    risky: {

        id:
            "risky",

        name:
            "risky",

        description:
            "one in four spins achieves absolutely nothing.",

minWager:
    25000,

maxBoostExtra:
    25000,

boostsEnabled:
    true,

        costMultiplier:
            1,

        nothingChance:
            25,

        boostsEnabled:
            true,

        allowedRarities: [
            "epic",
            "legendary",
            "mythic",
            "ultra-legendary"
        ],

        rarityChances: {

            common:
                0,

            uncommon:
                0,

            rare:
                0,

            "super-rare":
                0,

            epic:
                55,

            legendary:
                28,

            mythic:
                14,

            "ultra-legendary":
                3

        }

    },


    jackpot: {

        id:
            "jackpot",

        name:
            "jackpot",

        description:
            "90% financial evaporation. 10% terrible possibilities.",

minWager:
    50000,

maxBoostExtra:
    0,

boostsEnabled:
    false,

        costMultiplier:
            1,

        nothingChance:
            90,

        boostsEnabled:
            false,

        allowedRarities: [
            "mythic",
            "ultra-legendary"
        ],

        rarityChances: {

            common:
                0,

            uncommon:
                0,

            rare:
                0,

            "super-rare":
                0,

            epic:
                0,

            legendary:
                0,

            mythic:
                80,

            "ultra-legendary":
                20

        }

    }

};


/* =========================================================
   wager options
   ========================================================= */

export const wagerOptions = [
    500,
    1000,
    2500,
    5000,
    10000,
    25000,
    50000,
    100000
];


/* =========================================================
   anomalies
   ========================================================= */

export const anomalyConfig = {

    enabled:
        true,

    jackpotOnly:
        true,

    /*
        percentage of ALL jackpot spins

        0.02%
        ≈ 1 in 5,000 jackpot spins

        this happens before the normal
        jackpot reward rarity is chosen.
    */

    baseChance:
        0.02

};


/* =========================================================
   wheel helpers
   ========================================================= */

export function getWheelType(
    wheelId = "balanced"
) {

    return (
        wheelTypes[
            wheelId
        ] ??
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
        wheelTypes[
            wheelId
        ]
    );

}


export function getMinimumWager(
    wheelId
) {

    return getWheelType(
        wheelId
    ).minWager;

}


export function canUseWagerBoost(
    wheelId
) {

    return Boolean(
        getWheelType(
            wheelId
        ).boostsEnabled
    );

}


export function getNothingChance(
    wheelId
) {

    return Number(
        getWheelType(
            wheelId
        ).nothingChance ??
        0
    );

}


/* =========================================================
   wager boost
   ========================================================= */

export function getWagerBoost(
    wheelId,
    wager
) {

    const wheel =
        getWheelType(
            wheelId
        );

    if (
        !wheel.boostsEnabled
    ) {
        return 0;
    }

    const numericWager =
        Number(
            wager
        );

    if (
        !Number.isFinite(
            numericWager
        )
    ) {
        return 0;
    }

    const extra =
        Math.max(
            0,
            numericWager -
            wheel.minWager
        );

    const maxExtra =
        Number(
            wheel.maxBoostExtra ??
            0
        );

    if (
        maxExtra <= 0
    ) {
        return 0;
    }

    const progress =
        Math.min(
            1,
            extra /
            maxExtra
        );

    return (
        progress *
        MAX_WAGER_BOOST
    );
}

export function getWagerBoostProgress(
    wheelId,
    wager
) {

    const wheel =
        getWheelType(
            wheelId
        );

    const extra =
        Math.max(
            0,
            Number(wager) -
            wheel.minWager
        );

    const maxExtra =
        wheel.maxBoostExtra ??
        0;

    return {

        extra,

        maxExtra,

        cappedExtra:
            Math.min(
                extra,
                maxExtra
            ),

        boost:
            getWagerBoost(
                wheelId,
                wager
            )

    };
}

/* =========================================================
   boosted rarity table
   ========================================================= */

export function getBoostedRarityChances(
    wheelId,
    wager
) {

    const wheel =
        getWheelType(
            wheelId
        );


    const chances = {

        ...wheel.rarityChances

    };


    const boost =
        getWagerBoost(
            wheelId,
            wager
        );


    if (
        boost <= 0
    ) {
        return chances;
    }


    const available =
        publicRarityOrder.filter(
            (rarity) =>
                Number(
                    chances[
                        rarity
                    ] ??
                    0
                ) > 0
        );


    if (
        available.length <
        2
    ) {
        return chances;
    }


    /*
        boost is taken from the lowest
        available rarity and distributed
        toward higher rarities.

        10,000 SC = 1 total percentage point.
    */

    const lowest =
        available[
            0
        ];


    const removable =
        Math.min(
            boost,
            chances[
                lowest
            ]
        );


    chances[
        lowest
    ] -=
        removable;


    const higher =
        available.slice(
            1
        );


    /*
        increasingly favor the higher end
        of the rarity ladder
    */

    const weights =
        higher.map(
            (
                rarity,
                index
            ) =>
                index +
                1
        );


    const weightTotal =
        weights.reduce(
            (
                total,
                weight
            ) =>
                total +
                weight,
            0
        );


    higher.forEach(
        (
            rarity,
            index
        ) => {

            chances[
                rarity
            ] +=
                removable *
                (
                    weights[
                        index
                    ] /
                    weightTotal
                );

        }
    );


    return chances;

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
        Number(
            wager
        );


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
   wager validation
   ========================================================= */

export function isValidWager(
    wheelId,
    wager
) {

    const numericWager =
        Number(
            wager
        );


    if (
        !Number.isFinite(
            numericWager
        )
    ) {
        return false;
    }


    return (
        numericWager >=
        getMinimumWager(
            wheelId
        )
    );

}


/* =========================================================
   nothing roll
   ========================================================= */

export function rollNothing(
    wheelId
) {

    const chance =
        getNothingChance(
            wheelId
        );


    if (
        chance <= 0
    ) {
        return false;
    }


    return (
        Math.random() *
        100
    ) < chance;

}


/* =========================================================
   rarity roll
   ========================================================= */

export function rollRarity(
    wheelId = "balanced",
    wager = 0
) {

    const chances =
        getBoostedRarityChances(
            wheelId,
            wager
        );


    const entries =
        publicRarityOrder
            .map(
                (
                    rarityId
                ) => ({

                    rarityId,

                    chance:
                        Number(
                            chances[
                                rarityId
                            ] ??
                            0
                        )

                })
            )
            .filter(
                (
                    entry
                ) =>
                    entry.chance >
                    0
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


    if (
        total <= 0
    ) {
        return null;
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


        if (
            roll <= 0
        ) {
            return entry.rarityId;
        }

    }


    return entries[
        entries.length -
        1
    ]?.rarityId ??
        null;

}


/* =========================================================
   rarity odds
   ========================================================= */

export function getRarityChance(
    wheelId,
    rarityId,
    wager = 0
) {

    const chances =
        getBoostedRarityChances(
            wheelId,
            wager
        );


    const conditionalChance =
        Number(
            chances[
                rarityId
            ] ??
            0
        );


    if (
        conditionalChance <= 0
    ) {
        return 0;
    }


    const nothingChance =
        getNothingChance(
            wheelId
        );


    const successChance =
        (
            100 -
            nothingChance
        ) /
        100;


    return (
        conditionalChance *
        successChance
    );

}


export function getRarityChances(
    wheelId,
    wager = 0
) {

    const chances =
        getBoostedRarityChances(
            wheelId,
            wager
        );


    const nothingChance =
        getNothingChance(
            wheelId
        );


    const successChance =
        (
            100 -
            nothingChance
        ) /
        100;


    const output =
        {};


    for (
        const [
            rarity,
            chance
        ]
        of Object.entries(
            chances
        )
    ) {

        output[
            rarity
        ] =
            chance *
            successChance;

    }


    return output;

}


/* =========================================================
   anomaly system
   ========================================================= */

export function getAnomalyChance(
    wheelId = "balanced"
) {

    if (
        !anomalyConfig.enabled ||
        wheelId !==
        "jackpot"
    ) {
        return 0;
    }


    return anomalyConfig
        .baseChance;

}


export function rollAnomaly(
    wheelId = "balanced"
) {

    const chance =
        getAnomalyChance(
            wheelId
        );


    if (
        chance <= 0
    ) {
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

export function getIndividualSoggyChance(
    wheelId,
    rarityId,
    poolSize,
    wager = 0
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
            rarityId,
            wager
        );


    if (
        rarityChance <= 0
    ) {
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


    if (
        chance >= 1
    ) {

        return (
            Number(
                chance.toFixed(
                    2
                )
            ) +
            "%"
        );

    }


    if (
        chance >= 0.01
    ) {

        return (
            Number(
                chance.toFixed(
                    4
                )
            ) +
            "%"
        );

    }


    return (
        Number(
            chance.toFixed(
                6
            )
        ) +
        "%"
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
    wheelId,
    wager = 0
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

        minWager:
            wheel.minWager,

        costMultiplier:
            wheel.costMultiplier,

        nothingChance:
            wheel.nothingChance,

        boostsEnabled:
            wheel.boostsEnabled,

        wagerBoost:
            getWagerBoost(
                wheelId,
                wager
            ),

        rarityChances:
            getRarityChances(
                wheelId,
                wager
            )

    };

}


/* =========================================================
   validation
   ========================================================= */

export function validateWheelConfig() {

    const problems =
        [];


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
                    Number(
                        chance
                    ),
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
                `${wheel.id}: successful rarity chances total ${rarityTotal}% instead of 100%.`
            );

        }


        if (
            wheel.minWager <=
            0
        ) {

            problems.push(
                `${wheel.id}: invalid minimum wager.`
            );

        }


        if (
            wheel.nothingChance <
                0 ||
            wheel.nothingChance >
                100
        ) {

            problems.push(
                `${wheel.id}: invalid nothing chance.`
            );

        }

    }


    return {

        valid:
            problems.length ===
            0,

        problems

    };

}

