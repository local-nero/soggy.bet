const STORAGE_KEY =
    "soggybet_player";

const PLAYER_VERSION =
    3;


/* =========================================================
   defaults
   ========================================================= */

const DEFAULT_PLAYER = {

    version:
        PLAYER_VERSION,

    username:
        "guest",

    balance:
        10000,

    inventory:
        [],

    discovered:
        [],

    wheelHistory:
        [],

    statistics: {

        totalWagered:
            0,

        totalWon:
            0,

        wheelSpins:
            0,

        soggiesCollected:
            0,

        soggiesSold:
            0,

        dailyPuddlesClaimed:
            0

    },

    settings: {

        sound:
            true,

        animations:
            true,

        reducedMotion:
            false,

        cutscenes:
            "full",

        confirmSelling:
            true,

        touchGrassEnabled:
            true

    },

    dailyReward: {

        lastClaimed:
            0

    },

    touchGrass: {

        startedAt:
            Date.now(),

        lastTouched:
            null

    }

};


/* =========================================================
   helpers
   ========================================================= */

function clone(
    value
) {

    return JSON.parse(
        JSON.stringify(
            value
        )
    );

}


function normalizeUsername(
    username
) {

    if (
        typeof username !==
        "string"
    ) {
        return "guest";
    }

    const clean =
        username
            .trim()
            .slice(
                0,
                32
            );

    return (
        clean ||
        "guest"
    );

}


/* =========================================================
   great rebalance migration
   ========================================================= */

function migratePlayer(
    saved
) {

    const savedVersion =
        Number(
            saved?.version ??
            0
        );


    if (
        savedVersion >=
        PLAYER_VERSION
    ) {
        return saved;
    }


    console.log(
        "[soggybet] applying The Great Rebalance economy reset"
    );


    /*
        keep identity + preferences.

        everything economy-related
        starts fresh.
    */

    const fresh =
        clone(
            DEFAULT_PLAYER
        );


    fresh.username =
        normalizeUsername(
            saved?.username
        );


    if (
        saved?.settings &&
        typeof saved.settings ===
        "object"
    ) {

        fresh.settings = {

            ...fresh.settings,

            ...saved.settings

        };

    }


    fresh.version =
        PLAYER_VERSION;


    return fresh;

}


/* =========================================================
   normalization
   ========================================================= */

function normalizePlayer(
    saved = {}
) {

    const migrated =
        migratePlayer(
            saved
        );


    const player = {

        ...clone(
            DEFAULT_PLAYER
        ),

        ...migrated,


        statistics: {

            ...clone(
                DEFAULT_PLAYER.statistics
            ),

            ...(
                migrated.statistics ??
                {}
            )

        },


        settings: {

            ...clone(
                DEFAULT_PLAYER.settings
            ),

            ...(
                migrated.settings ??
                {}
            )

        },


        dailyReward: {

            ...clone(
                DEFAULT_PLAYER.dailyReward
            ),

            ...(
                migrated.dailyReward ??
                {}
            )

        },


        touchGrass: {

            ...clone(
                DEFAULT_PLAYER.touchGrass
            ),

            ...(
                migrated.touchGrass ??
                {}
            )

        }

    };


    if (
        !Array.isArray(
            player.inventory
        )
    ) {

        player.inventory =
            [];

    }


    if (
        !Array.isArray(
            player.discovered
        )
    ) {

        player.discovered =
            [];

    }


    if (
        !Array.isArray(
            player.wheelHistory
        )
    ) {

        player.wheelHistory =
            [];

    }


    player.username =
        normalizeUsername(
            player.username
        );


    const balance =
        Number(
            player.balance
        );


    player.balance =
        Number.isFinite(
            balance
        )
            ? balance
            : DEFAULT_PLAYER.balance;


    player.version =
        PLAYER_VERSION;


    return player;

}


/* =========================================================
   read
   ========================================================= */

export function getPlayer() {

    const raw =
        localStorage.getItem(
            STORAGE_KEY
        );


    /*
        first visit
    */

    if (!raw) {

        const player =
            clone(
                DEFAULT_PLAYER
            );


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                player
            )
        );


        return player;

    }


    try {

        const parsed =
            JSON.parse(
                raw
            );


        const normalized =
            normalizePlayer(
                parsed
            );


        /*
            persist migrations automatically.

            this is what applies
            The Great Rebalance reset
            to old V2 saves.
        */

        if (
            Number(
                parsed.version ??
                0
            ) !==
            PLAYER_VERSION
        ) {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    normalized
                )
            );

        }


        return normalized;

    }

    catch (error) {

        console.error(
            "[soggybet] failed to load player save:",
            error
        );


        const player =
            clone(
                DEFAULT_PLAYER
            );


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                player
            )
        );


        return player;

    }

}


/* =========================================================
   write
   ========================================================= */

export function savePlayer(
    player
) {

    const normalized =
        normalizePlayer(
            player
        );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            normalized
        )
    );


    window.dispatchEvent(
        new CustomEvent(
            "soggybet:player-updated",
            {

                detail: {

                    player:
                        normalized

                }

            }
        )
    );


    return normalized;

}


/* =========================================================
   update
   ========================================================= */

export function updatePlayer(
    callback
) {

    const player =
        getPlayer();


    const result =
        callback(
            player
        );


    return savePlayer(
        result ??
        player
    );

}


/* =========================================================
   username
   ========================================================= */

export function getUsername() {

    return normalizeUsername(
        getPlayer()
            .username
    );

}


export function setUsername(
    username
) {

    const value =
        normalizeUsername(
            username
        );


    return updatePlayer(
        (player) => {

            player.username =
                value;

            return player;

        }
    );

}


/* =========================================================
   reset
   ========================================================= */

export function resetPlayer() {

    const player =
        clone(
            DEFAULT_PLAYER
        );


    return savePlayer(
        player
    );

}


/* =========================================================
   economy reset
   ========================================================= */

export function resetEconomy() {

    const oldPlayer =
        getPlayer();


    const fresh =
        clone(
            DEFAULT_PLAYER
        );


    /*
        preserve identity
        and preferences
    */

    fresh.username =
        normalizeUsername(
            oldPlayer.username
        );


    fresh.settings = {

        ...fresh.settings,

        ...oldPlayer.settings

    };


    return savePlayer(
        fresh
    );

}


/* =========================================================
   export
   ========================================================= */

export function exportPlayerSave() {

    return JSON.stringify(
        getPlayer(),
        null,
        2
    );

}


/* =========================================================
   import
   ========================================================= */

export function importPlayerSave(
    json
) {

    const parsed =
        JSON.parse(
            json
        );


    return savePlayer(
        parsed
    );

}
