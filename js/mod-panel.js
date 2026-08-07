// soggybet developer / moderator testing panel

import {
    addBalance,
    formatSoggyCoins
} from "/js/balance.js";

import {
    getPlayer,
    updatePlayer
} from "/js/storage.js";

import {
    getSoggyById
} from "/js/soggies.js";

import {
    showToast
} from "/js/app.js";


const OVERRIDE_KEY =
    "soggybet_dev_spin_override";

const FREE_SPINS_KEY =
    "soggybet_dev_free_spins";


/* =========================================================
   helpers
   ========================================================= */

function getOverride() {
    try {
        return JSON.parse(
            localStorage.getItem(
                OVERRIDE_KEY
            )
        );
    }

    catch {
        return null;
    }
}


function setOverride(value) {
    if (!value) {
        localStorage.removeItem(
            OVERRIDE_KEY
        );

        updateOverrideDisplay();

        return;
    }

    localStorage.setItem(
        OVERRIDE_KEY,
        JSON.stringify(value)
    );

    updateOverrideDisplay();
}


export function consumeDevSpinOverride() {
    const override =
        getOverride();

    if (!override) {
        return null;
    }

    /*
        one spin only
    */

    localStorage.removeItem(
        OVERRIDE_KEY
    );

    updateOverrideDisplay();

    return override;
}


export function devFreeSpinsEnabled() {
    return (
        localStorage.getItem(
            FREE_SPINS_KEY
        ) === "1"
    );
}


/* =========================================================
   panel
   ========================================================= */

const panel =
    document.createElement(
        "aside"
    );

panel.className =
    "mod-panel";

panel.id =
    "mod-panel";

panel.innerHTML = `
    <div class="mod-panel-header">

        <div>
            <span class="mod-panel-kicker">
                soggybet developer
            </span>

            <strong>
                sog control panel
            </strong>
        </div>

        <button
            class="mod-panel-close"
            id="mod-panel-close"
            type="button"
        >
            ×
        </button>

    </div>


    <section class="mod-section">

        <span class="mod-section-title">
            next spin
        </span>

        <div class="mod-current">

            <span>
                forced result
            </span>

            <strong id="mod-forced-result">
                none
            </strong>

        </div>


        <label class="mod-label">
            force rarity
        </label>

        <select
            class="mod-input"
            id="mod-rarity"
        >
            <option value="">
                choose rarity
            </option>

            <option value="common">
                common
            </option>

            <option value="uncommon">
                uncommon
            </option>

            <option value="rare">
                rare
            </option>

            <option value="super-rare">
                super rare
            </option>

            <option value="epic">
                epic
            </option>

            <option value="legendary">
                legendary
            </option>

            <option value="mythic">
                mythic
            </option>

            <option value="ultra-legendary">
                ultra legendary
            </option>
        </select>

        <button
            class="button"
            id="mod-force-rarity"
            type="button"
        >
            force rarity
        </button>


        <label class="mod-label">
            specific soggy id
        </label>

        <input
            class="mod-input"
            id="mod-soggy-id"
            type="text"
            placeholder="example: stylish-soggy"
            autocomplete="off"
        >

        <button
            class="button"
            id="mod-force-soggy"
            type="button"
        >
            force soggy
        </button>


        <div class="mod-button-grid">

            <button
                class="button"
                id="mod-force-anomaly"
                type="button"
            >
                force anomaly
            </button>

            <button
                class="button danger"
                id="mod-clear-force"
                type="button"
            >
                clear
            </button>

        </div>

    </section>


    <section class="mod-section">

        <span class="mod-section-title">
            soggycoins
        </span>

        <input
            class="mod-input"
            id="mod-coins"
            type="number"
            value="100000"
            min="1"
        >

        <div class="mod-button-grid">

            <button
                class="button"
                id="mod-add-coins"
                type="button"
            >
                add
            </button>

            <button
                class="button"
                id="mod-set-coins"
                type="button"
            >
                set
            </button>

        </div>

    </section>


    <section class="mod-section">

        <span class="mod-section-title">
            soggies
        </span>

        <input
            class="mod-input"
            id="mod-add-soggy-id"
            type="text"
            placeholder="soggy id"
            autocomplete="off"
        >

        <div class="mod-button-grid">

            <button
                class="button"
                id="mod-add-soggy"
                type="button"
            >
                add to my sogs
            </button>

            <button
                class="button"
                id="mod-discover-soggy"
                type="button"
            >
                unlock dex
            </button>

        </div>

    </section>


    <section class="mod-section">

        <span class="mod-section-title">
            testing
        </span>

        <label class="mod-toggle-row">

            <span>
                free spins
            </span>

            <input
                id="mod-free-spins"
                type="checkbox"
            >

        </label>

        <button
            class="button"
            id="mod-reset-daily"
            type="button"
        >
            reset daily reward
        </button>

    </section>


    <div class="mod-panel-footer">
        ctrl + shift + m
    </div>
`;


document.body.append(
    panel
);


/* =========================================================
   elements
   ========================================================= */

const forcedResult =
    panel.querySelector(
        "#mod-forced-result"
    );

const raritySelect =
    panel.querySelector(
        "#mod-rarity"
    );

const forceRarityButton =
    panel.querySelector(
        "#mod-force-rarity"
    );

const soggyIdInput =
    panel.querySelector(
        "#mod-soggy-id"
    );

const forceSoggyButton =
    panel.querySelector(
        "#mod-force-soggy"
    );

const forceAnomalyButton =
    panel.querySelector(
        "#mod-force-anomaly"
    );

const clearForceButton =
    panel.querySelector(
        "#mod-clear-force"
    );

const coinInput =
    panel.querySelector(
        "#mod-coins"
    );

const addCoinsButton =
    panel.querySelector(
        "#mod-add-coins"
    );

const setCoinsButton =
    panel.querySelector(
        "#mod-set-coins"
    );

const addSoggyIdInput =
    panel.querySelector(
        "#mod-add-soggy-id"
    );

const addSoggyButton =
    panel.querySelector(
        "#mod-add-soggy"
    );

const discoverSoggyButton =
    panel.querySelector(
        "#mod-discover-soggy"
    );

const freeSpinsToggle =
    panel.querySelector(
        "#mod-free-spins"
    );

const resetDailyButton =
    panel.querySelector(
        "#mod-reset-daily"
    );

const closeButton =
    panel.querySelector(
        "#mod-panel-close"
    );


/* =========================================================
   display
   ========================================================= */

function updateOverrideDisplay() {
    const override =
        getOverride();

    if (!override) {
        forcedResult.textContent =
            "none";

        return;
    }

    if (
        override.type ===
        "rarity"
    ) {
        forcedResult.textContent =
            override.rarity.replaceAll(
                "-",
                " "
            );

        return;
    }

    if (
        override.type ===
        "soggy"
    ) {
        forcedResult.textContent =
            `soggy: ${override.soggyId}`;

        return;
    }

    if (
        override.type ===
        "anomaly"
    ) {
        forcedResult.textContent =
            "████████";

        return;
    }

    forcedResult.textContent =
        "unknown";
}


/* =========================================================
   force results
   ========================================================= */

forceRarityButton.addEventListener(
    "click",
    () => {
        const rarity =
            raritySelect.value;

        if (!rarity) {
            showToast(
                "pick a rarity first.",
                "error"
            );

            return;
        }

        setOverride({
            type: "rarity",
            rarity
        });

        showToast(
            `next spin forced to ${rarity.replaceAll(
                "-",
                " "
            )}.`,
            "success"
        );
    }
);


forceSoggyButton.addEventListener(
    "click",
    async () => {
        const id =
            soggyIdInput.value.trim();

        if (!id) {
            return;
        }

        const soggy =
            await getSoggyById(id);

        if (!soggy) {
            showToast(
                `unknown soggy id: ${id}`,
                "error"
            );

            return;
        }

        setOverride({
            type: "soggy",
            soggyId: id
        });

        showToast(
            `next spin forced to ${soggy.name}.`,
            "success"
        );
    }
);


forceAnomalyButton.addEventListener(
    "click",
    () => {
        setOverride({
            type: "anomaly"
        });

        showToast(
            "something is wrong with the next spin.",
            "success"
        );
    }
);


clearForceButton.addEventListener(
    "click",
    () => {
        setOverride(null);

        showToast(
            "forced result cleared."
        );
    }
);


/* =========================================================
   coins
   ========================================================= */

function getCoinAmount() {
    const value =
        Number(
            coinInput.value
        );

    if (
        !Number.isFinite(value) ||
        value < 0
    ) {
        return null;
    }

    return Math.round(value);
}


addCoinsButton.addEventListener(
    "click",
    () => {
        const amount =
            getCoinAmount();

        if (amount === null) {
            return;
        }

        addBalance(amount);

        showToast(
            `added ${formatSoggyCoins(
                amount
            )} sc.`,
            "success"
        );
    }
);


setCoinsButton.addEventListener(
    "click",
    () => {
        const amount =
            getCoinAmount();

        if (amount === null) {
            return;
        }

        updatePlayer(
            (player) => {
                player.balance =
                    amount;

                return player;
            }
        );

        showToast(
            `balance set to ${formatSoggyCoins(
                amount
            )} sc.`,
            "success"
        );
    }
);


/* =========================================================
   inventory
   ========================================================= */

async function getPanelSoggy() {
    const id =
        addSoggyIdInput
            .value
            .trim();

    if (!id) {
        showToast(
            "enter a soggy id.",
            "error"
        );

        return null;
    }

    const soggy =
        await getSoggyById(id);

    if (!soggy) {
        showToast(
            `unknown soggy id: ${id}`,
            "error"
        );

        return null;
    }

    return soggy;
}


addSoggyButton.addEventListener(
    "click",
    async () => {
        const soggy =
            await getPanelSoggy();

        if (!soggy) {
            return;
        }

        updatePlayer(
            (player) => {
                player.inventory ??= [];

                player.inventory.push({
                    instanceId:
                        crypto.randomUUID(),

                    soggyId:
                        soggy.id,

                    obtainedAt:
                        Date.now(),

                    source:
                        "mod-panel",

                    wheel:
                        null,

                    wager:
                        0,

                    chance:
                        null
                });

                player.statistics ??= {};

                player.statistics
                    .soggiesCollected ??=
                    0;

                player.statistics
                    .soggiesCollected +=
                    1;

                return player;
            }
        );

        showToast(
            `${soggy.name} added to my sogs.`,
            "success"
        );
    }
);


discoverSoggyButton.addEventListener(
    "click",
    async () => {
        const soggy =
            await getPanelSoggy();

        if (!soggy) {
            return;
        }

        updatePlayer(
            (player) => {
                player.discovered ??= [];

                if (
                    !player.discovered
                        .includes(
                            soggy.id
                        )
                ) {
                    player.discovered.push(
                        soggy.id
                    );
                }

                return player;
            }
        );

        showToast(
            `${soggy.name} unlocked in the soggydex.`,
            "success"
        );
    }
);


/* =========================================================
   free spins
   ========================================================= */

freeSpinsToggle.checked =
    devFreeSpinsEnabled();


freeSpinsToggle.addEventListener(
    "change",
    () => {
        localStorage.setItem(
            FREE_SPINS_KEY,
            freeSpinsToggle.checked
                ? "1"
                : "0"
        );

        showToast(
            freeSpinsToggle.checked
                ? "free spins enabled."
                : "free spins disabled."
        );
    }
);


/* =========================================================
   daily
   ========================================================= */

resetDailyButton.addEventListener(
    "click",
    () => {
        updatePlayer(
            (player) => {
                player.dailyReward ??= {};

                player.dailyReward
                    .lastClaimed =
                    0;

                return player;
            }
        );

        showToast(
            "daily reward reset.",
            "success"
        );
    }
);


/* =========================================================
   opening / closing
   ========================================================= */

function togglePanel() {
    panel.classList.toggle(
        "is-open"
    );
}


closeButton.addEventListener(
    "click",
    () => {
        panel.classList.remove(
            "is-open"
        );
    }
);


document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.code === "KeyM"
        ) {
            event.preventDefault();

            togglePanel();
        }
    }
);


updateOverrideDisplay();
