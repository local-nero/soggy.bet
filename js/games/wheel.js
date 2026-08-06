// Nothing here but us soggies

import {
    addBalance,
    formatSoggyCoins,
    subtractBalance
} from "/js/balance.js";

import {
    getPlayer,
    updatePlayer
} from "/js/storage.js";

import {
    showToast
} from "/js/app.js";

import {
    getRandomAnomaly,
    getRandomWheelSoggy,
    getWheelSoggiesByRarity
} from "/js/soggies.js";

import {
    anomalyConfig,
    formatChance,
    formatOdds,
    getAllWheelTypes,
    getAnomalyChance,
    getIndividualSoggyChance,
    getRarityChance,
    getSpinCost,
    getWheelType,
    rollAnomaly,
    rollCoinReward,
    rollRarity,
    rollRewardType,
    wagerOptions
} from "/data/wheel-rewards.js";

import {
    getRarity
} from "/data/rarities.js";


/* =========================================================
   DOM
   ========================================================= */

const wheel = document.querySelector("#wheel");
const spinButton = document.querySelector("#spin-button");
const wheelStatus = document.querySelector("#wheel-status");
const wheelHistory = document.querySelector("#wheel-history");

const spinCostText = document.querySelector("#spin-cost");
const spinCostValue = document.querySelector("#spin-cost-value");

const rewardModal = document.querySelector("#reward-modal");
const rewardRarity = document.querySelector("#reward-rarity");
const rewardTitle = document.querySelector("#reward-title");
const rewardDescription = document.querySelector("#reward-description");
const rewardValue = document.querySelector("#reward-value");

const rewardImage = document.querySelector("#reward-image");
const rewardImageFallback = document.querySelector(
    "#reward-image-fallback"
);

const keepRewardButton = document.querySelector(
    "#keep-reward-button"
);

const sellRewardButton = document.querySelector(
    "#sell-reward-button"
);


/* optional ui we will use when present */

const wheelTypeButtons = document.querySelectorAll(
    "[data-wheel-type]"
);

const wagerButtons = document.querySelectorAll(
    "[data-wager]"
);

const wagerInput = document.querySelector("#wager-input");

const selectedWheelName = document.querySelector(
    "#selected-wheel-name"
);

const selectedWheelDescription = document.querySelector(
    "#selected-wheel-description"
);


/* =========================================================
   CONFIG
   ========================================================= */

const SPIN_DURATION = 6200;

const CUTSCENE_RARITIES = new Set([
    "mythic",
    "legendary",
    "ultra-legendary"
]);

const RARITY_COLORS = {
    common: "#9ca3af",
    uncommon: "#4ade80",
    rare: "#3b82f6",
    "super-rare": "#a855f7",
    epic: "#f97316",
    mythic: "#ef4444",
    legendary: "#facc15",
    "ultra-legendary": "#67e8f9",
    anomaly: "#ffffff"
};


/* =========================================================
   STATE
   ========================================================= */

let currentWheelId = "balanced";
let currentWager = 500;

let currentRotation = 0;
let spinning = false;

let pendingReward = null;

let rewardResolved = true;


/* =========================================================
   PLAYER HELPERS
   ========================================================= */

function ensurePlayerShape(player) {
    if (!Array.isArray(player.inventory)) {
        player.inventory = [];
    }

    if (!Array.isArray(player.discovered)) {
        player.discovered = [];
    }

    if (!Array.isArray(player.wheelHistory)) {
        player.wheelHistory = [];
    }

    if (!player.statistics) {
        player.statistics = {};
    }

    player.statistics.totalWagered ??= 0;
    player.statistics.totalWon ??= 0;
    player.statistics.wheelSpins ??= 0;
    player.statistics.soggiesCollected ??= 0;
    player.statistics.soggiesSold ??= 0;

    return player;
}


function hasDiscoveredSoggy(soggyId) {
    const player = ensurePlayerShape(
        getPlayer()
    );

    return player.discovered.includes(
        soggyId
    );
}


function markDiscovered(soggyId) {
    let newDiscovery = false;

    updatePlayer((player) => {
        ensurePlayerShape(player);

        if (
            !player.discovered.includes(
                soggyId
            )
        ) {
            player.discovered.push(
                soggyId
            );

            newDiscovery = true;
        }

        return player;
    });

    return newDiscovery;
}


function addSoggyToInventory(
    soggy,
    sourceData
) {
    updatePlayer((player) => {
        ensurePlayerShape(player);

        player.inventory.push({
            instanceId:
                crypto.randomUUID(),

            soggyId:
                soggy.id,

            obtainedAt:
                Date.now(),

            source:
                "wheel",

            wheel:
                sourceData.wheelId,

            wager:
                sourceData.wager,

            chance:
                sourceData.chance
        });

        player.statistics.soggiesCollected += 1;

        return player;
    });
}


function recordSpin(result) {
    updatePlayer((player) => {
        ensurePlayerShape(player);

        const spinCost = getSpinCost(
            currentWheelId,
            currentWager
        );

        player.statistics.totalWagered +=
            spinCost;

        player.statistics.wheelSpins += 1;

        player.wheelHistory.unshift({
            id:
                crypto.randomUUID(),

            createdAt:
                Date.now(),

            wheelId:
                currentWheelId,

            wager:
                currentWager,

            spinCost,

            type:
                result.type,

            soggyId:
                result.soggy?.id ?? null,

            rarity:
                result.soggy?.rarity ?? null,

            amount:
                result.amount ?? null,

            multiplier:
                result.multiplier ?? null,

            chance:
                result.chance ?? null,

            anomaly:
                result.anomaly === true
        });

        player.wheelHistory =
            player.wheelHistory.slice(
                0,
                20
            );

        return player;
    });
}


/* =========================================================
   WHEEL + WAGER UI
   ========================================================= */

function setWheelType(wheelId) {
    const wheelType = getWheelType(
        wheelId
    );

    currentWheelId = wheelType.id;

    wheelTypeButtons.forEach(
        (button) => {
            button.classList.toggle(
                "is-active",
                button.dataset.wheelType ===
                    currentWheelId
            );
        }
    );

    if (selectedWheelName) {
        selectedWheelName.textContent =
            wheelType.name;
    }

    if (selectedWheelDescription) {
        selectedWheelDescription.textContent =
            wheelType.description;
    }

    updateSpinCost();

    renderWheelVisual();
}


function setWager(value) {
    const wager = Number(value);

    if (
        !Number.isFinite(wager) ||
        wager <= 0
    ) {
        return;
    }

    currentWager = Math.round(
        wager
    );

    wagerButtons.forEach(
        (button) => {
            button.classList.toggle(
                "is-active",
                Number(
                    button.dataset.wager
                ) === currentWager
            );
        }
    );

    if (wagerInput) {
        wagerInput.value =
            currentWager;
    }

    updateSpinCost();
}


function updateSpinCost() {
    const cost = getSpinCost(
        currentWheelId,
        currentWager
    );

    if (spinCostText) {
        spinCostText.textContent =
            `${formatSoggyCoins(cost)} sc`;
    }

    if (spinCostValue) {
        spinCostValue.textContent =
            formatSoggyCoins(cost);
    }
}


/* =========================================================
   VISUAL WHEEL
   ========================================================= */

function renderWheelVisual() {
    if (!wheel) {
        return;
    }

    const config = getWheelType(
        currentWheelId
    );

    const segments = Object.entries(
        config.rarityChances
    );

    const colors = [];

    let currentAngle = 0;

    for (
        const [rarityId, chance]
        of segments
    ) {
        const nextAngle =
            currentAngle +
            (
                chance /
                100
            ) *
            360;

        const color =
            RARITY_COLORS[
                rarityId
            ] ??
            "#64748b";

        colors.push(
            `${color} ${currentAngle}deg ${nextAngle}deg`
        );

        currentAngle =
            nextAngle;
    }

    wheel.style.background =
        `conic-gradient(${colors.join(",")})`;
}


/* =========================================================
   ODDS
   ========================================================= */

async function calculateFullSpinChance(
    soggy
) {
    if (
        !soggy ||
        soggy.rarity === "anomaly"
    ) {
        return null;
    }

    const config = getWheelType(
        currentWheelId
    );

    const pool =
        await getWheelSoggiesByRarity(
            soggy.rarity
        );

    if (!pool.length) {
        return null;
    }

    const conditionalChance =
        getIndividualSoggyChance(
            currentWheelId,
            soggy.rarity,
            pool.length
        );

    if (
        !Number.isFinite(
            conditionalChance
        )
    ) {
        return null;
    }

    /*
        rarity chance happens only after
        reward type = soggy.

        example:

        balanced:
        80% chance of a soggy

        ultra legendary:
        0.2%

        9 ultra legendaries

        80% × 0.2% / 9
    */

    const soggyRewardFactor =
        config.soggyChance /
        100;

    return (
        conditionalChance *
        soggyRewardFactor
    );
}


/* =========================================================
   RESULT ROLLING
   ========================================================= */

async function rollSpinResult() {
    /*
        anomaly check happens before
        normal reward generation.
    */

    if (
        anomalyConfig.enabled &&
        rollAnomaly(
            currentWheelId
        )
    ) {
        const anomaly =
            await getRandomAnomaly();

        if (anomaly) {
            return {
                type: "soggy",
                soggy: anomaly,
                anomaly: true,
                chance: null
            };
        }
    }

    const rewardType =
        rollRewardType(
            currentWheelId
        );

    if (rewardType === "coins") {
        const coinReward =
            rollCoinReward(
                currentWheelId,
                currentWager
            );

        return {
            type: "coins",
            amount:
                coinReward.amount,

            multiplier:
                coinReward.multiplier,

            anomaly: false
        };
    }

    const rarity =
        rollRarity(
            currentWheelId
        );

    const soggy =
        await getRandomWheelSoggy(
            rarity
        );

    if (!soggy) {
        throw new Error(
            `no wheel soggies found for rarity "${rarity}".`
        );
    }

    const chance =
        await calculateFullSpinChance(
            soggy
        );

    return {
        type: "soggy",
        soggy,
        anomaly: false,
        chance
    };
}


/* =========================================================
   SPIN ANIMATION
   ========================================================= */

function getVisualSegmentCenter(
    result
) {
    if (
        result.type === "coins"
    ) {
        /*
            coin rewards are not represented
            by a public rarity segment yet.

            use a random visual position.
        */

        return (
            Math.random() *
            360
        );
    }

    const config = getWheelType(
        currentWheelId
    );

    let startAngle = 0;

    for (
        const rarityId
        of Object.keys(
            config.rarityChances
        )
    ) {
        const chance =
            config.rarityChances[
                rarityId
            ];

        const segmentSize =
            (
                chance /
                100
            ) *
            360;

        if (
            rarityId ===
            result.soggy.rarity
        ) {
            return (
                startAngle +
                segmentSize / 2
            );
        }

        startAngle +=
            segmentSize;
    }

    return Math.random() * 360;
}


function calculateTargetRotation(
    result
) {
    const center =
        getVisualSegmentCenter(
            result
        );

    const pointerTarget =
        360 - center;

    const normalizedCurrent =
        (
            (
                currentRotation %
                360
            ) +
            360
        ) %
        360;

    const adjustment =
        (
            pointerTarget -
            normalizedCurrent +
            360
        ) %
        360;

    const rotations =
        (
            7 +
            Math.floor(
                Math.random() *
                3
            )
        ) *
        360;

    return (
        currentRotation +
        rotations +
        adjustment
    );
}


function setSpinning(value) {
    spinning = value;

    if (!spinButton) {
        return;
    }

    spinButton.disabled =
        value;

    spinButton.textContent =
        value
            ? "spinning..."
            : "spin wheel";
}


/* =========================================================
   CUTSCENES
   ========================================================= */

function ensureCutsceneElement() {
    let element =
        document.querySelector(
            "#soggy-cutscene"
        );

    if (element) {
        return element;
    }

    element =
        document.createElement(
            "div"
        );

    element.id =
        "soggy-cutscene";

    element.className =
        "soggy-cutscene";

    element.innerHTML = `
        <div class="soggy-cutscene-noise"></div>

        <div class="soggy-cutscene-center">
            <div class="soggy-cutscene-star">✦</div>

            <div class="soggy-cutscene-rarity"></div>
        </div>
    `;

    document.body.append(
        element
    );

    return element;
}


function getCutsceneDuration(
    rarity
) {
    switch (rarity) {
        case "mythic":
            return 2200;

        case "legendary":
            return 3000;

        case "ultra-legendary":
            return 4200;

        case "anomaly":
            return 5000;

        default:
            return 0;
    }
}


async function playCutscene(
    soggy
) {
    if (!soggy) {
        return;
    }

    const rarity =
        soggy.rarity;

    const shouldPlay =
        CUTSCENE_RARITIES.has(
            rarity
        ) ||
        rarity === "anomaly";

    if (!shouldPlay) {
        return;
    }

    const player =
        getPlayer();

    const setting =
        player.settings
            ?.cutscenes ??
        "full";

    if (setting === "instant") {
        return;
    }

    const cutscene =
        ensureCutsceneElement();

    const rarityText =
        cutscene.querySelector(
            ".soggy-cutscene-rarity"
        );

    const star =
        cutscene.querySelector(
            ".soggy-cutscene-star"
        );

    cutscene.className =
        `soggy-cutscene rarity-${rarity}`;

    rarityText.textContent =
        rarity === "anomaly"
            ? "████████"
            : rarity;

    star.textContent =
        rarity === "anomaly"
            ? "█"
            : "✦";

    document.body.classList.add(
        "cutscene-active"
    );

    cutscene.classList.add(
        "is-active"
    );

    const duration =
        setting === "short"
            ? 1000
            : getCutsceneDuration(
                rarity
            );

    await new Promise(
        (resolve) => {
            window.setTimeout(
                resolve,
                duration
            );
        }
    );

    cutscene.classList.remove(
        "is-active"
    );

    document.body.classList.remove(
        "cutscene-active"
    );
}


/* =========================================================
   REWARD MODAL
   ========================================================= */

function resetRewardModal() {
    if (!rewardModal) {
        return;
    }

    rewardModal.className =
        "reward-modal";

    rewardRarity.className =
        "badge";

    rewardImage.hidden =
        true;

    rewardImageFallback.hidden =
        false;

    sellRewardButton.hidden =
        false;

    keepRewardButton.hidden =
        false;
}


async function showSoggyReward(
    result
) {
    const soggy =
        result.soggy;

    const alreadyDiscovered =
        hasDiscoveredSoggy(
            soggy.id
        );

    const newDiscovery =
        !alreadyDiscovered;

    pendingReward = {
        ...result,
        newDiscovery
    };

    rewardResolved = false;

    resetRewardModal();

    rewardTitle.textContent =
        soggy.name;

    rewardDescription.textContent =
        soggy.description
            ? `"${soggy.description}"`
            : "████████████";

    if (
        soggy.rarity ===
        "anomaly"
    ) {
        rewardRarity.textContent =
            "████████";

        rewardRarity.className =
            "badge";

        rewardValue.textContent =
            "???";

        rewardModal.classList.add(
            "reward-anomaly"
        );
    } else {
        const rarity =
            getRarity(
                soggy.rarity
            );

        rewardRarity.textContent =
            rarity?.name ??
            soggy.rarity;

        rewardRarity.className =
            `badge ${soggy.rarity}`;

        rewardValue.textContent =
            `${formatSoggyCoins(
                soggy.value
            )} sc`;

        rewardModal.classList.add(
            `reward-${soggy.rarity}`
        );
    }

    rewardImage.src =
        soggy.image;

    rewardImage.alt =
        soggy.name;

    rewardImageFallback.textContent =
        "🐈";

    rewardImage.onload = () => {
        rewardImage.hidden =
            false;

        rewardImageFallback.hidden =
            true;
    };

    rewardImage.onerror = () => {
        rewardImage.hidden =
            true;

        rewardImageFallback.hidden =
            false;
    };

    /*
        inject odds beneath card if
        the html doesn't already have it
    */

    let oddsBox =
        rewardModal.querySelector(
            ".reward-odds"
        );

    if (!oddsBox) {
        oddsBox =
            document.createElement(
                "div"
            );

        oddsBox.className =
            "reward-odds";

        rewardValue
            .closest(
                ".reward-value"
            )
            ?.after(
                oddsBox
            );
    }

    if (
        result.anomaly
    ) {
        oddsBox.innerHTML = `
            <div>
                <span>chance</span>
                <strong>???</strong>
            </div>

            <div>
                <span>odds</span>
                <strong>???</strong>
            </div>
        `;
    } else {
        oddsBox.innerHTML = `
            <div>
                <span>chance</span>
                <strong>${formatChance(
                    result.chance
                )}</strong>
            </div>

            <div>
                <span>odds</span>
                <strong>${formatOdds(
                    result.chance
                )}</strong>
            </div>
        `;
    }

    let discovery =
        rewardModal.querySelector(
            ".reward-discovery"
        );

    if (!discovery) {
        discovery =
            document.createElement(
                "div"
            );

        discovery.className =
            "reward-discovery";

        rewardTitle.before(
            discovery
        );
    }

    if (newDiscovery) {
        discovery.textContent =
            "✨ new variant discovered!";

        discovery.classList.add(
            "is-new"
        );

        /*
            first discovery cannot be sold
        */

        sellRewardButton.hidden =
            true;

        keepRewardButton.textContent =
            "keep";
    } else {
        discovery.textContent =
            "already rescued.";

        discovery.classList.remove(
            "is-new"
        );

        sellRewardButton.hidden =
            soggy.rarity ===
            "anomaly";

        keepRewardButton.textContent =
            "keep another";
    }

    rewardModal.classList.add(
        "is-open"
    );

    rewardModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function showCoinReward(
    result
) {
    pendingReward = result;

    rewardResolved = false;

    resetRewardModal();

    rewardRarity.textContent =
        "soggycoins";

    rewardRarity.className =
        "badge original";

    rewardImageFallback.textContent =
        "💧";

    rewardTitle.textContent =
        `${formatSoggyCoins(
            result.amount
        )} soggycoins`;

    rewardDescription.textContent =
        result.amount === 0
            ? "the wheel has chosen dryness."
            : "the puddle grows.";

    rewardValue.textContent =
        `${formatSoggyCoins(
            result.amount
        )} sc`;

    keepRewardButton.textContent =
        result.amount > 0
            ? "claim"
            : "accept fate";

    sellRewardButton.hidden =
        true;

    rewardModal.classList.add(
        "reward-rare",
        "is-open"
    );

    rewardModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   REWARD RESOLUTION
   ========================================================= */

function keepPendingReward() {
    if (
        !pendingReward ||
        rewardResolved
    ) {
        return;
    }

    if (
        pendingReward.type ===
        "coins"
    ) {
        if (
            pendingReward.amount >
            0
        ) {
            addBalance(
                pendingReward.amount
            );

            updatePlayer(
                (player) => {
                    ensurePlayerShape(
                        player
                    );

                    player.statistics.totalWon +=
                        pendingReward.amount;

                    return player;
                }
            );
        }

        rewardResolved =
            true;

        closeRewardModal();

        return;
    }

    const soggy =
        pendingReward.soggy;

    addSoggyToInventory(
        soggy,
        {
            wheelId:
                currentWheelId,

            wager:
                currentWager,

            chance:
                pendingReward.chance
        }
    );

    markDiscovered(
        soggy.id
    );

    showToast(
        pendingReward.newDiscovery
            ? `${soggy.name} was added to your soggydex.`
            : `${soggy.name} was added to my sogs.`,
        "success"
    );

    rewardResolved =
        true;

    closeRewardModal();
}


function sellPendingReward() {
    if (
        !pendingReward ||
        rewardResolved ||
        pendingReward.type !==
            "soggy"
    ) {
        return;
    }

    const soggy =
        pendingReward.soggy;

    if (
        pendingReward.newDiscovery
    ) {
        return;
    }

    if (
        soggy.rarity ===
        "anomaly"
    ) {
        return;
    }

    addBalance(
        soggy.value
    );

    updatePlayer((player) => {
        ensurePlayerShape(player);

        player.statistics.totalWon +=
            soggy.value;

        player.statistics.soggiesSold +=
            1;

        return player;
    });

    showToast(
        `${soggy.name} was released for ${formatSoggyCoins(
            soggy.value
        )} sc.`,
        "success"
    );

    rewardResolved =
        true;

    closeRewardModal();
}


function closeRewardModal() {
    /*
        cannot accidentally throw away
        an unresolved reward
    */

    if (!rewardResolved) {
        return;
    }

    rewardModal?.classList.remove(
        "is-open"
    );

    rewardModal?.setAttribute(
        "aria-hidden",
        "true"
    );

    pendingReward =
        null;

    renderHistory();
}


/* =========================================================
   HISTORY
   ========================================================= */

function formatHistoryTime(
    timestamp
) {
    return new Intl.DateTimeFormat(
        "en",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(timestamp)
    );
}


function renderHistory() {
    if (!wheelHistory) {
        return;
    }

    const player =
        ensurePlayerShape(
            getPlayer()
        );

    const history =
        player.wheelHistory;

    wheelHistory.replaceChildren();

    if (!history.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "wheel-history-empty";

        empty.textContent =
            "no spins yet. the wheel remains suspiciously dry.";

        wheelHistory.append(
            empty
        );

        return;
    }

    for (
        const entry
        of history.slice(0, 10)
    ) {
        const card =
            document.createElement(
                "article"
            );

        card.className =
            "history-card";

        const top =
            document.createElement(
                "div"
            );

        top.className =
            "history-card-top";

        const icon =
            document.createElement(
                "span"
            );

        icon.className =
            "history-card-icon";

        icon.textContent =
            entry.anomaly
                ? "█"
                : entry.type ===
                    "coins"
                    ? "💧"
                    : "🐈";

        const time =
            document.createElement(
                "time"
            );

        time.textContent =
            formatHistoryTime(
                entry.createdAt
            );

        top.append(
            icon,
            time
        );

        const title =
            document.createElement(
                "strong"
            );

        if (
            entry.type ===
            "coins"
        ) {
            title.textContent =
                `${formatSoggyCoins(
                    entry.amount
                )} sc`;
        } else {
            title.textContent =
                entry.anomaly
                    ? "████████"
                    : entry.soggyId;
        }

        const detail =
            document.createElement(
                "span"
            );

        if (
            entry.type ===
            "coins"
        ) {
            detail.textContent =
                `${entry.multiplier}×`;
        } else if (
            entry.anomaly
        ) {
            detail.textContent =
                "???";
        } else {
            detail.textContent =
                entry.rarity.replace(
                    "-",
                    " "
                );
        }

        card.append(
            top,
            title,
            detail
        );

        wheelHistory.append(
            card
        );
    }
}


/* =========================================================
   MAIN SPIN
   ========================================================= */

async function spinWheel() {
    if (spinning) {
        return;
    }

    const cost =
        getSpinCost(
            currentWheelId,
            currentWager
        );

    if (
        !subtractBalance(
            cost
        )
    ) {
        showToast(
            "you do not have enough soggycoins.",
            "error"
        );

        if (wheelStatus) {
            wheelStatus.textContent =
                "insufficient moisture funds.";
        }

        return;
    }

    setSpinning(true);

    if (wheelStatus) {
        wheelStatus.textContent =
            "consulting the sog council...";
    }

    try {
        const result =
            await rollSpinResult();

        recordSpin(
            result
        );

        const targetRotation =
            calculateTargetRotation(
                result
            );

        currentRotation =
            targetRotation;

        requestAnimationFrame(
            () => {
                wheel.style.transform =
                    `rotate(${targetRotation}deg)`;
            }
        );

        await new Promise(
            (resolve) => {
                window.setTimeout(
                    resolve,
                    SPIN_DURATION
                );
            }
        );

        if (result.type === "soggy") {
            if (wheelStatus) {
                wheelStatus.textContent =
                    result.anomaly
                        ? "..."
                        : `landed on ${result.soggy.rarity.replace("-", " ")}.`;
            }

            await playCutscene(
                result.soggy
            );

            await showSoggyReward(
                result
            );
        } else {
            if (wheelStatus) {
                wheelStatus.textContent =
                    result.amount > 0
                        ? `won ${formatSoggyCoins(
                            result.amount
                        )} sc.`
                        : "the wheel chose dryness.";
            }

            showCoinReward(
                result
            );
        }
    } catch (error) {
        console.error(
            "wheel spin failed:",
            error
        );

        /*
            refund failed spins
        */

        addBalance(
            cost
        );

        showToast(
            "the wheel broke reality. your spin was refunded.",
            "error"
        );

        if (wheelStatus) {
            wheelStatus.textContent =
                "reality has been restored.";
        }
    } finally {
        setSpinning(false);

        renderHistory();
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

spinButton?.addEventListener(
    "click",
    spinWheel
);


keepRewardButton?.addEventListener(
    "click",
    keepPendingReward
);


sellRewardButton?.addEventListener(
    "click",
    sellPendingReward
);


wheelTypeButtons.forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                if (spinning) {
                    return;
                }

                setWheelType(
                    button.dataset
                        .wheelType
                );
            }
        );
    }
);


wagerButtons.forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                if (spinning) {
                    return;
                }

                setWager(
                    button.dataset
                        .wager
                );
            }
        );
    }
);


wagerInput?.addEventListener(
    "change",
    () => {
        if (spinning) {
            return;
        }

        setWager(
            wagerInput.value
        );
    }
);


document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.code === "Space" &&
            !event.repeat &&
            !rewardModal?.classList.contains(
                "is-open"
            )
        ) {
            event.preventDefault();

            spinWheel();
        }
    }
);


/* =========================================================
   INIT
   ========================================================= */

async function initializeWheel() {
    setWheelType(
        currentWheelId
    );

    setWager(
        currentWager
    );

    renderHistory();

    if (wheelStatus) {
        wheelStatus.textContent =
            "the wheel is suspiciously dry.";
    }

    /*
        useful development information
    */

    console.log(
        "[soggybet] wheel ready",
        {
            wheels:
                getAllWheelTypes()
                    .map(
                        (entry) =>
                            entry.id
                    ),

            wagers:
                wagerOptions,

            anomalyChance:
                getAnomalyChance(
                    currentWheelId
                )
        }
    );
}


initializeWheel().catch(
    (error) => {
        console.error(
            "failed to initialize wheel:",
            error
        );

        showToast(
            "the sogs failed to initialize.",
            "error"
        );
    }
);
