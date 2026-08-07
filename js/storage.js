const STORAGE_KEY = "soggybet_player";


const DEFAULT_PLAYER = {
    version: 2,

    username: "guest",

    balance: 10000,

    inventory: [],

    discovered: [],

    wheelHistory: [],

    statistics: {
        totalWagered: 0,
        totalWon: 0,
        wheelSpins: 0,
        soggiesCollected: 0,
        soggiesSold: 0,
        dailyPuddlesClaimed: 0
    },

    settings: {
        sound: true,
        animations: true,
        reducedMotion: false,
        cutscenes: "full",
        confirmSelling: true,
        touchGrassEnabled: true
    },

    dailyReward: {
        lastClaimed: 0
    },

    touchGrass: {
        startedAt: Date.now(),
        lastTouched: null
    }
};


/* =========================================================
   helpers
   ========================================================= */

function clone(value) {
    return JSON.parse(
        JSON.stringify(value)
    );
}


function normalizePlayer(saved = {}) {
    const player = {
        ...clone(DEFAULT_PLAYER),
        ...saved,

        statistics: {
            ...clone(
                DEFAULT_PLAYER.statistics
            ),

            ...(saved.statistics ?? {})
        },

        settings: {
            ...clone(
                DEFAULT_PLAYER.settings
            ),

            ...(saved.settings ?? {})
        },

        dailyReward: {
            ...clone(
                DEFAULT_PLAYER.dailyReward
            ),

            ...(saved.dailyReward ?? {})
        },

        touchGrass: {
            ...clone(
                DEFAULT_PLAYER.touchGrass
            ),

            ...(saved.touchGrass ?? {})
        }
    };


    if (!Array.isArray(player.inventory)) {
        player.inventory = [];
    }


    if (!Array.isArray(player.discovered)) {
        player.discovered = [];
    }


    if (!Array.isArray(player.wheelHistory)) {
        player.wheelHistory = [];
    }


    if (
        typeof player.username !==
        "string"
    ) {
        player.username = "guest";
    }


    const balance =
        Number(player.balance);


    player.balance =
        Number.isFinite(balance)
            ? balance
            : DEFAULT_PLAYER.balance;


    player.version =
        DEFAULT_PLAYER.version;


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
            clone(DEFAULT_PLAYER);


        /*
            save directly.

            IMPORTANT:
            do not call savePlayer() here,
            because reading player data should
            not trigger player-updated events.
        */

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(player)
        );


        return player;
    }


    try {
        const parsed =
            JSON.parse(raw);


        return normalizePlayer(
            parsed
        );
    }

    catch (error) {
        console.error(
            "[soggybet] failed to load player save:",
            error
        );


        const player =
            clone(DEFAULT_PLAYER);


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(player)
        );


        return player;
    }
}


/* =========================================================
   write
   ========================================================= */

export function savePlayer(player) {
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


    /*
        only WRITING triggers this event.

        getPlayer() never does.
    */

    window.dispatchEvent(
        new CustomEvent(
            "soggybet:player-updated",
            {
                detail: {
                    player: normalized
                }
            }
        )
    );


    return normalized;
}


/* =========================================================
   update
   ========================================================= */

export function updatePlayer(callback) {
    const player =
        getPlayer();


    const result =
        callback(player);


    return savePlayer(
        result ?? player
    );
}


/* =========================================================
   reset
   ========================================================= */

export function resetPlayer() {
    const player =
        clone(DEFAULT_PLAYER);


    return savePlayer(
        player
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

export function importPlayerSave(json) {
    const parsed =
        JSON.parse(json);


    return savePlayer(
        parsed
    );
}
