// Nothing here but us soggies

/* mod panel
import {
    consumeDevSpinOverride,
    devFreeSpinsEnabled
} from "/js/mod-panel.js";
*/

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
    getSoggyById,
    getWheelSoggiesByRarity
} from "/js/soggies.js";

import {
    anomalyConfig,
    formatChance,
    formatOdds,
    getAnomalyChance,
    getIndividualSoggyChance,
    getSpinCost,
    getWheelType,
    rollAnomaly,
    rollRarity
} from "/data/wheel-rewards.js";

import {
    getRarity
} from "/data/rarities.js";

import {
    playSound,
    stopSound,
    fadeOutSound
} from "/js/sound.js";


/* =========================================================
   dom
   ========================================================= */

const wheel =
    document.querySelector("#wheel");

const spinButton =
    document.querySelector("#spin-button");

const wheelStatus =
    document.querySelector("#wheel-status");

const wheelHistory =
    document.querySelector("#wheel-history");

const spinCostValue =
    document.querySelector("#spin-cost-value");

const wheelStageName =
    document.querySelector("#wheel-stage-name");

const selectedWheelName =
    document.querySelector("#selected-wheel-name");

const selectedWheelDescription =
    document.querySelector("#selected-wheel-description");

const wheelTypeButtons =
    document.querySelectorAll("[data-wheel-type]");

const wagerButtons =
    document.querySelectorAll("[data-wager]");

const wagerInput =
    document.querySelector("#wager-input");


/* modal */

const rewardModal =
    document.querySelector("#reward-modal");

const rewardRarity =
    document.querySelector("#reward-rarity");

const rewardImage =
    document.querySelector("#reward-image");

const rewardImageFallback =
    document.querySelector("#reward-image-fallback");

const rewardDiscovery =
    document.querySelector("#reward-discovery");

const rewardTitle =
    document.querySelector("#reward-title");

const rewardDescription =
    document.querySelector("#reward-description");

const rewardValue =
    document.querySelector("#reward-value");

const rewardChance =
    document.querySelector("#reward-chance");

const rewardOddsValue =
    document.querySelector("#reward-odds-value");

const rewardOdds =
    document.querySelector("#reward-odds");

const keepButton =
    document.querySelector("#keep-reward-button");

const sellButton =
    document.querySelector("#sell-reward-button");


/* =========================================================
   config
   ========================================================= */

const SPIN_DURATION = 6200;

const CUTSCENE_RARITIES = new Set([
    "mythic",
    "legendary",
    "ultra-legendary"
]);

const RARITY_COLORS = {
    common: "#b6bdc8",
    uncommon: "#22d36b",
    rare: "#3b82f6",
    "super-rare": "#1d4ed8",
    epic: "#c026ff",
    legendary: "#facc15",
    mythic: "#dc2626"
};


/* =========================================================
   state
   ========================================================= */

let currentWheelId =
    "balanced";

let currentWager =
    500;

let currentRotation =
    0;

let spinning =
    false;

let pendingReward =
    null;

let rewardResolved =
    true;

let skipSpinRequested =
    false;

let finishSpinWait =
    null;


/* =========================================================
   player structure
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

    if (!player.settings) {
        player.settings = {};
    }

    player.statistics.totalWagered ??= 0;
    player.statistics.totalWon ??= 0;
    player.statistics.wheelSpins ??= 0;
    player.statistics.soggiesCollected ??= 0;
    player.statistics.soggiesSold ??= 0;

    player.settings.cutscenes ??= "full";

    return player;
}


/* =========================================================
   wheel selection
   ========================================================= */

function selectWheel(wheelId) {

    const config =
        getWheelType(wheelId);

    currentWheelId =
        config.id;

    wheelTypeButtons.forEach((button) => {

        button.classList.toggle(
            "is-active",
            button.dataset.wheelType === currentWheelId
        );

    });

    if (selectedWheelName) {
        selectedWheelName.textContent =
            config.name;
    }

    if (selectedWheelDescription) {
        selectedWheelDescription.textContent =
            config.description;
    }

    if (wheelStageName) {
        wheelStageName.textContent =
            config.name;
    }

    renderWheel();
    updateCost();
}


/* =========================================================
   wager
   ========================================================= */

function selectWager(value) {

    const amount =
        Number(value);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return;
    }

    currentWager =
        Math.round(amount);

    wagerButtons.forEach((button) => {

        button.classList.toggle(
            "is-active",
            Number(button.dataset.wager) === currentWager
        );

    });

    if (wagerInput) {
        wagerInput.value =
            currentWager;
    }

    updateCost();
}


function updateCost() {

    const cost =
        getSpinCost(
            currentWheelId,
            currentWager
        );

    if (spinCostValue) {

        spinCostValue.textContent =
            formatSoggyCoins(cost);

    }
}


/* =========================================================
   wheel rendering
   ========================================================= */

function renderWheel() {

    if (!wheel) {
        return;
    }

    const config =
        getWheelType(currentWheelId);

    const stops = [];

    let angle = 0;

    for (
        const [rarity, chance]
        of Object.entries(config.rarityChances)
    ) {

        const size =
            chance / 100 * 360;

        const end =
            angle + size;

        if (rarity === "ultra-legendary") {

            const quarter =
                size / 4;

            stops.push(
                `#55eaff ${angle}deg ${angle + quarter}deg`,
                `#7798ff ${angle + quarter}deg ${angle + quarter * 2}deg`,
                `#bd62ff ${angle + quarter * 2}deg ${angle + quarter * 3}deg`,
                `#ff36ed ${angle + quarter * 3}deg ${end}deg`
            );
        }

        else {

            const color =
                RARITY_COLORS[rarity] ??
                "#64748b";

            stops.push(
                `${color} ${angle}deg ${end}deg`
            );
        }

        angle =
            end;
    }

    wheel.style.background =
        `conic-gradient(${stops.join(",")})`;
}


/* =========================================================
   odds
   ========================================================= */

async function getFullSpinChance(soggy) {

    if (
        !soggy ||
        soggy.rarity === "anomaly"
    ) {
        return null;
    }

    const pool =
        await getWheelSoggiesByRarity(
            soggy.rarity
        );

    if (!pool.length) {
        return null;
    }

    return getIndividualSoggyChance(
        currentWheelId,
        soggy.rarity,
        pool.length
    );
}


/* =========================================================
   result generation
   ========================================================= */

async function generateResult() {
/* mod panel
    const forced =
        consumeDevSpinOverride();
*/

    /* force specific soggy

    if (
        forced?.type ===
        "soggy"
    ) {
        const soggy =
            await getSoggyById(
                forced.soggyId
            );

        if (!soggy) {
            throw new Error(
                `forced soggy does not exist: ${forced.soggyId}`
            );
        }

        return {
            type: "soggy",
            soggy,

            anomaly:
                soggy.rarity ===
                "anomaly",

            chance:
                soggy.rarity === "anomaly"
                    ? null
                    : await getFullSpinChance(
                        soggy
                    )
        };
    }
    
*/

    /* force rarity

    if (
        forced?.type ===
        "rarity"
    ) {
        const soggy =
            await getRandomWheelSoggy(
                forced.rarity
            );

        if (!soggy) {
            throw new Error(
                `no soggies available for forced rarity ${forced.rarity}`
            );
        }

        return {
            type: "soggy",
            soggy,
            anomaly: false,

            chance:
                await getFullSpinChance(
                    soggy
                )
        };
    }
*/

    /* force anomaly

    if (
        forced?.type ===
        "anomaly"
    ) {
        const anomaly =
            await getRandomAnomaly();

        if (!anomaly) {
            throw new Error(
                "no anomalies available"
            );
        }

        return {
            type: "soggy",
            soggy: anomaly,
            anomaly: true,
            chance: null
        };
    }
*/

    /* normal hidden anomaly roll */

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


    /* normal wheel roll */

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
            `no wheel soggies available for ${rarity}`
        );
    }

    return {
        type: "soggy",
        soggy,
        anomaly: false,

        chance:
            await getFullSpinChance(
                soggy
            )
    };
}

/* =========================================================
   pointer target
   ========================================================= */

function getTargetAngle(result) {

    if (result.anomaly) {
        return Math.random() * 360;
    }

    const config =
        getWheelType(currentWheelId);

    let start =
        0;

    for (
        const [rarity, chance]
        of Object.entries(config.rarityChances)
    ) {

        const size =
            chance / 100 * 360;

        if (
            rarity ===
            result.soggy.rarity
        ) {

            /*
                random position inside segment
                instead of always dead center
            */

            const padding =
                Math.min(
                    3,
                    size * 0.15
                );

            return (
                start +
                padding +
                Math.random() *
                Math.max(
                    0.001,
                    size - padding * 2
                )
            );
        }

        start += size;
    }

    return Math.random() * 360;
}


/* =========================================================
   animation
   ========================================================= */

function calculateRotation(result) {

    const target =
        getTargetAngle(result);

    /*
        pointer is at 0 degrees / top.
    */

    const desired =
        360 - target;

    const normalized =
        ((currentRotation % 360) + 360) % 360;

    const adjustment =
        (
            desired -
            normalized +
            360
        ) % 360;

    const spins =
        (
            7 +
            Math.floor(
                Math.random() * 3
            )
        ) *
        360;

    return (
        currentRotation +
        spins +
        adjustment
    );
}


function setSpinning(value) {

    spinning =
        value;

    wagerInput.disabled =
        value;

    wheelTypeButtons.forEach(
        (button) => {
            button.disabled =
                value;
        }
    );

    wagerButtons.forEach(
        (button) => {
            button.disabled =
                value;
        }
    );

    spinButton.innerHTML =
        value
            ? `
                <span>skip spin</span>
                <span class="spin-arrow">→</span>
            `
            : `
                <span>spin wheel</span>
                <span class="spin-arrow">→</span>
            `;
}


/* =========================================================
   discoveries
   ========================================================= */

function isDiscovered(id) {

    const player =
        ensurePlayerShape(
            getPlayer()
        );

    return player.discovered.includes(id);
}


function discover(id) {

    updatePlayer((player) => {

        ensurePlayerShape(player);

        if (!player.discovered.includes(id)) {
            player.discovered.push(id);
        }

        return player;
    });
}


/* =========================================================
   inventory
   ========================================================= */

function addToInventory(
    soggy,
    chance
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
                currentWheelId,

            wager:
                currentWager,

            chance
        });

        player.statistics.soggiesCollected +=
            1;

        return player;
    });
}


/* =========================================================
   history
   ========================================================= */

function saveHistory(result) {

    updatePlayer((player) => {

        ensurePlayerShape(player);

        const cost =
            getSpinCost(
                currentWheelId,
                currentWager
            );

        player.statistics.totalWagered +=
            cost;

        player.statistics.wheelSpins +=
            1;

        player.wheelHistory.unshift({

            id:
                crypto.randomUUID(),

            createdAt:
                Date.now(),

            wheelId:
                currentWheelId,

            wager:
                currentWager,

            spinCost:
                cost,

            type:
                result.type,

            soggyId:
                result.soggy?.id ??
                null,

            rarity:
                result.soggy?.rarity ??
                null,

            amount:
                result.amount ??
                null,

            multiplier:
                result.multiplier ??
                null,

            anomaly:
                Boolean(
                    result.anomaly
                )
        });

        player.wheelHistory =
            player.wheelHistory.slice(
                0,
                20
            );

        return player;
    });
}


async function renderHistory() {

    wheelHistory.replaceChildren();

    const player =
        ensurePlayerShape(
            getPlayer()
        );

    if (!player.wheelHistory.length) {

        const empty =
            document.createElement("div");

        empty.className =
            "wheel-history-empty";

        empty.textContent =
            "no spins yet. the wheel remains suspiciously dry.";

        wheelHistory.append(empty);

        return;
    }


    for (
        const entry
        of player.wheelHistory.slice(0, 10)
    ) {

        const card =
            document.createElement("article");

        card.className =
            "history-card";


        const top =
            document.createElement("div");

        top.className =
            "history-card-top";


        const icon =
            document.createElement("span");

        icon.className =
            "history-card-icon";


        const time =
            document.createElement("time");

        time.textContent =
            new Intl.DateTimeFormat(
                "en",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(
                new Date(
                    entry.createdAt
                )
            );


        const title =
            document.createElement("strong");


        const detail =
            document.createElement("span");


        if (entry.type === "coins") {

            icon.textContent =
                "💧";

            title.textContent =
                `${formatSoggyCoins(entry.amount)} sc`;

            detail.textContent =
                `${entry.multiplier}×`;
        }

        else if (entry.anomaly) {

            icon.textContent =
                "█";

            title.textContent =
                "████████";

            detail.textContent =
                "???";
        }

        else {

            icon.textContent =
                "🐈";

            const soggy =
                await getSoggyById(
                    entry.soggyId
                );

            title.textContent =
                soggy?.name ??
                "unknown soggy";

            detail.textContent =
                entry.rarity
                    ?.replaceAll("-", " ") ??
                "";
        }


        top.append(
            icon,
            time
        );

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
   cutscene
   ========================================================= */

function getCutsceneElement() {

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

            <div class="soggy-cutscene-star">
                ✦
            </div>

            <div class="soggy-cutscene-rarity">
            </div>

        </div>
    `;

    document.body.append(element);

    return element;
}


function cutsceneDuration(rarity) {
    switch (rarity) {
        case "legendary":
            return 2600;

        case "mythic":
            return 3600;

        case "ultra-legendary":
            return 4200;

        case "anomaly":
            return 5200;

        default:
            return 0;
    }
}


async function playCutscene(soggy) {
    const rarity =
        soggy.rarity;

    if (
        !CUTSCENE_RARITIES.has(rarity) &&
        rarity !== "anomaly"
    ) {
        return;
    }


    const player =
        ensurePlayerShape(
            getPlayer()
        );

    const mode =
        player.settings.cutscenes;


    if (mode === "instant") {
        return;
    }


    const scene =
        getCutsceneElement();

    const star =
        scene.querySelector(
            ".soggy-cutscene-star"
        );

    const label =
        scene.querySelector(
            ".soggy-cutscene-rarity"
        );


/*
    reset animation so it can replay
    even if the player gets another
    high-rarity sog immediately after.
*/

scene.classList.remove(
    "is-active"
);

/*
    cancel any previous animations
*/

star.getAnimations().forEach(
    (animation) => {
        animation.cancel();
    }
);

/*
    force a reflow so the next
    animation starts from frame 0
*/

void star.offsetWidth;

    void scene.offsetWidth;


    scene.className =
        `soggy-cutscene rarity-${rarity}`;


    if (rarity === "anomaly") {
        star.textContent =
            "█";

        label.textContent =
            "████████";
    }

    else {
        star.textContent =
            "✦";

        label.textContent =
            rarity.replaceAll(
                "-",
                " "
            );
    }


    /*
        rarity-specific animation timing
    */

    switch (rarity) {
        case "legendary":
            star.style.animationDuration =
                "2.6s, 180ms";
            break;

        case "mythic":
            star.style.animationDuration =
                "3.6s, 130ms";
            break;

        case "ultra-legendary":
            star.style.animationDuration =
                "4.2s, 90ms";
            break;

        case "anomaly":
            star.style.animationDuration =
                "5.2s, 55ms";
            break;

        default:
            star.style.animationDuration =
                "3.6s, 130ms";
    }


    document.body.classList.add(
        "cutscene-active"
    );

    scene.classList.add(
        "is-active"
    );

    switch (rarity) {

    case "legendary":

        playSound(
            "legendary"
        );

        break;

    case "mythic":

        playSound(
            "mythic"
        );

        break;

    case "ultra-legendary":

        playSound(
            "ultra"
        );

        break;

    case "anomaly":

        playSound(
            "anomaly"
        );

        break;

}


    const duration =
        mode === "short"
            ? 1200
            : cutsceneDuration(
                rarity
            );


   await new Promise(
    (resolve) =>
        setTimeout(
            resolve,
            duration
        )
);

/*
    impact / flash
*/

playSound(
    "flash",
    {
        volume: 1
    }
);

/*
    fade cutscene out
*/

scene.classList.remove(
    "is-active"
);


    await new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                180
            )
    );


    document.body.classList.remove(
        "cutscene-active"
    );


    /*
        clean inline animation timing
        for the next cutscene
    */

    star.style.animationDuration =
        "";
}

/* =========================================================
   reward modal
   ========================================================= */

function prepareModal() {

    rewardModal.className =
        "reward-modal";

    rewardImage.hidden =
        true;

    rewardImageFallback.hidden =
        false;

    rewardOdds.hidden =
        false;

    sellButton.hidden =
        false;

    keepButton.hidden =
        false;
}


async function showSoggy(result) {

    prepareModal();

    const soggy =
        result.soggy;

    const newDiscovery =
        !isDiscovered(
            soggy.id
        );


    pendingReward = {
        ...result,
        newDiscovery
    };

    rewardResolved =
        false;


    rewardTitle.textContent =
        soggy.name;


    rewardDescription.textContent =
        soggy.description
            ? `"${soggy.description}"`
            : "████████████";


    rewardImage.src =
        soggy.image;

    rewardImage.alt =
        soggy.name;


    rewardImage.onload =
        () => {

            const shell =
                rewardImage.closest(
                    ".reward-image-shell"
                );

            if (shell) {

                shell.classList.remove(
                    "is-landscape",
                    "is-portrait",
                    "is-square",
                    "is-ultrawide",
                    "is-small-source"
                );

                const width =
                    rewardImage.naturalWidth;

                const height =
                    rewardImage.naturalHeight;

                const ratio =
                    width / height;

                if (ratio >= 2.2) {
                    shell.classList.add(
                        "is-ultrawide"
                    );
                }

                else if (ratio > 1.12) {
                    shell.classList.add(
                        "is-landscape"
                    );
                }

                else if (ratio < 0.88) {
                    shell.classList.add(
                        "is-portrait"
                    );
                }

                else {
                    shell.classList.add(
                        "is-square"
                    );
                }

                if (
                    width < 450 &&
                    height < 450
                ) {
                    shell.classList.add(
                        "is-small-source"
                    );
                }
            }

            rewardImage.hidden =
                false;

            rewardImageFallback.hidden =
                true;
        };


    rewardImage.onerror =
        () => {

            rewardImage.hidden =
                true;

            rewardImageFallback.hidden =
                false;
        };


    if (result.anomaly) {

        rewardRarity.textContent =
            "████████";

        rewardRarity.className =
            "badge";

        rewardValue.textContent =
            "???";

        rewardChance.textContent =
            "???";

        rewardOddsValue.textContent =
            "???";

        rewardModal.classList.add(
            "reward-anomaly"
        );
    }

    else {

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


        rewardChance.textContent =
            formatChance(
                result.chance
            );


        rewardOddsValue.textContent =
            formatOdds(
                result.chance
            );


        rewardModal.classList.add(
            `reward-${soggy.rarity}`
        );
    }


    if (newDiscovery) {

        rewardDiscovery.textContent =
            "✨ new variant discovered!";

        rewardDiscovery.classList.add(
            "is-new"
        );

        keepButton.textContent =
            "keep";

        /*
            first copy cannot be sold
        */

        sellButton.hidden =
            true;
    }

    else {

        rewardDiscovery.textContent =
            "already rescued.";

        rewardDiscovery.classList.remove(
            "is-new"
        );

        keepButton.textContent =
            "keep another";

        /*
            anomalies never sell
        */

        sellButton.hidden =
            result.anomaly;
    }


    rewardModal.classList.add(
        "is-open"
    );

    rewardModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   reward actions
   ========================================================= */

function keepReward() {

    if (
        !pendingReward ||
        rewardResolved
    ) {
        return;
    }


    /* soggy */

    const soggy =
        pendingReward.soggy;


    addToInventory(
        soggy,
        pendingReward.chance
    );


    discover(
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

    closeModal();
}


function sellReward() {

    if (
        !pendingReward ||
        rewardResolved ||
        pendingReward.type !== "soggy"
    ) {
        return;
    }


    if (
        pendingReward.newDiscovery ||
        pendingReward.anomaly
    ) {
        return;
    }


    const soggy =
        pendingReward.soggy;


    addBalance(
        soggy.value
    );


    updatePlayer(
        (player) => {

            ensurePlayerShape(player);

            player.statistics.totalWon +=
                soggy.value;

            player.statistics.soggiesSold +=
                1;

            return player;
        }
    );


    showToast(
        `${soggy.name} was released for ${formatSoggyCoins(
            soggy.value
        )} sc.`,
        "success"
    );


    rewardResolved =
        true;

    closeModal();
}


function closeModal() {

    /*
        never discard unresolved rewards
    */

    if (!rewardResolved) {
        return;
    }


    rewardModal.classList.remove(
        "is-open"
    );


    rewardModal.setAttribute(
        "aria-hidden",
        "true"
    );


    pendingReward =
        null;


    renderHistory();
}


/* =========================================================
   spin
   ========================================================= */

function waitForSpin(duration) {

    return new Promise(
        (resolve) => {

            let finished =
                false;

            const finish = () => {

                if (finished) {
                    return;
                }

                finished =
                    true;

                finishSpinWait =
                    null;

                resolve();
            };


            const timeout =
                setTimeout(
                    finish,
                    duration
                );


            finishSpinWait = () => {

                clearTimeout(
                    timeout
                );

                finish();
            };

        }
    );
}

async function announceRarePull(
    result
) {

    const soggy =
        result.soggy;

    if (!soggy) {
        return;
    }

    const allowedRarities =
        new Set([
            "mythic",
            "ultra-legendary",
            "anomaly"
        ]);

    if (
        !allowedRarities.has(
            soggy.rarity
        )
    ) {
        return;
    }

    const player =
        getPlayer();

    const username =
        player.username ??
        player.profile?.username ??
        "guest";

    const wheelConfig =
        getWheelType(
            currentWheelId
        );

    try {

        const response =
            await fetch(
                "/api/announce-pull",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            soggy,
                            chance:
                                result.chance,
                            wheel:
                                wheelConfig.name,
                            username
                        })
                }
            );

if (!response.ok) {

    const errorText =
        await response.text();

    console.error(
        "[soggybet] announcement failed:",
        response.status,
        errorText
    );

    return;
}

console.log(
    "[soggybet] pull announced successfully"
);
        
    } catch (error) {

        console.error(
            "[soggybet] announcement failed:",
            error
        );

    }

}

async function spin() {

    if (
        spinning ||
        rewardModal.classList.contains(
            "is-open"
        )
    ) {
        return;
    }


    const cost =
        getSpinCost(
            currentWheelId,
            currentWager
        );


    if (
        !subtractBalance(cost)
    ) {

        wheelStatus.textContent =
            "insufficient moisture funds.";


        showToast(
            "you do not have enough soggycoins.",
            "error"
        );

        return;
    }


    setSpinning(true);

    playSound(
    "wheelSpin",
    {
        loop: true,
        volume: 0.45
    }
);


    wheelStatus.textContent =
        "consulting the sog council...";


    try {

        const result =
            await generateResult();


        saveHistory(result);


        const rotation =
            calculateRotation(
                result
            );


        currentRotation =
            rotation;


        requestAnimationFrame(
            () => {

                wheel.style.transform =
                    `rotate(${rotation}deg)`;
            }
        );


await waitForSpin(
    SPIN_DURATION
);


wheelStatus.textContent =
    result.anomaly
        ? "..."
        : `landed on ${result.soggy.rarity.replaceAll("-", " ")}.`;

fadeOutSound(
    "wheelSpin",
    180
);

playSound(
    "wheelStop",
    {
        volume: 0.75
    }
);

        announceRarePull(
    result
);

await playCutscene(
    result.soggy
);

playSound(
    "cardReveal"
);

await showSoggy(
    result
);

} catch (error) {

    console.error(
        "wheel spin failed:",
        error
    );

    addBalance(
        cost
    );

    wheelStatus.textContent =
        "reality has been restored.";

    showToast(
        "the wheel broke reality. your spin was refunded.",
        "error"
    );

} finally {

    setSpinning(false);

    await renderHistory();

}


/* =========================================================
   events
   ========================================================= */

spinButton.addEventListener(
    "click",
    () => {

        if (spinning) {

            skipCurrentSpin();

            return;

        }

        spin();

    }
);


keepButton.addEventListener(
    "click",
    keepReward
);


sellButton.addEventListener(
    "click",
    sellReward
);


wheelTypeButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                if (spinning) {
                    return;
                }

                selectWheel(
                    button.dataset.wheelType
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

                selectWager(
                    button.dataset.wager
                );
            }
        );

    }
);


wagerInput.addEventListener(
    "change",
    () => {

        if (spinning) {
            return;
        }

        selectWager(
            wagerInput.value
        );
    }
);


/*
    spacebar = spin
*/

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.code !== "Space" ||
            event.repeat
        ) {
            return;
        }


        if (
            event.target.matches(
                "input, textarea, button"
            )
        ) {
            return;
        }


        event.preventDefault();

        spin();
    }
);


/* =========================================================
   init
   ========================================================= */

async function init() {

    selectWheel(
        "balanced"
    );

    selectWager(
        500
    );

    await renderHistory();


    wheelStatus.textContent =
        "the wheel is suspiciously dry.";


    console.log(
        "[soggybet] wheel loaded",
        {
            anomalyChance:
                getAnomalyChance(
                    currentWheelId
                )
        }
    );
}


init().catch(
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


/* =========================================================
   skip
   ========================================================= */

function skipCurrentSpin() {

    if (
        !spinning ||
        !finishSpinWait
    ) {
        return;
    }

    /*
        instantly finish the current spin wait
    */

    wheel.style.transition =
        "none";

    finishSpinWait();

    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    wheel.style.transition =
                        "";

                }
            );

        }
    );
}
