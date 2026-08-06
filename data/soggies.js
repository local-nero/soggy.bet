let soggyCache = null;

/**
 * load every soggy from /data/soggies.json
 */
export async function getAllSoggies() {
    if (soggyCache) {
        return soggyCache;
    }

    const response = await fetch("/data/soggies.json", {
        cache: "no-cache"
    });

    if (!response.ok) {
        throw new Error(
            `failed to load soggies.json (${response.status})`
        );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error(
            "soggies.json must contain an array."
        );
    }

    soggyCache = data;

    return soggyCache;
}

/**
 * clear the cached soggy data
 */
export function clearSoggyCache() {
    soggyCache = null;
}

/**
 * get one soggy by id
 */
export async function getSoggyById(id) {
    const soggies = await getAllSoggies();

    return soggies.find(
        (soggy) => soggy.id === id
    ) ?? null;
}

/**
 * get one soggy by dex number
 */
export async function getSoggyByDex(dex) {
    const soggies = await getAllSoggies();

    return soggies.find(
        (soggy) => soggy.dex === dex
    ) ?? null;
}

/**
 * get all public soggies
 */
export async function getVisibleSoggies() {
    const soggies = await getAllSoggies();

    return soggies
        .filter((soggy) => !soggy.hidden)
        .sort((a, b) => {
            return (a.dex ?? Infinity) - (b.dex ?? Infinity);
        });
}

/**
 * get all hidden anomaly soggies
 */
export async function getAnomalies() {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) =>
            soggy.hidden === true &&
            soggy.rarity === "anomaly"
    );
}

/**
 * get all soggies matching a rarity
 */
export async function getSoggiesByRarity(rarity) {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) => soggy.rarity === rarity
    );
}

/**
 * get only public wheel-obtainable soggies
 * from a specific rarity
 */
export async function getWheelSoggiesByRarity(rarity) {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) =>
            soggy.rarity === rarity &&
            soggy.hidden !== true &&
            soggy.obtainable?.wheel === true
    );
}

/**
 * get achievement-only soggies
 */
export async function getAchievementSoggies() {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) =>
            soggy.obtainable?.achievement === true
    );
}

/**
 * get a soggy awarded by a specific achievement
 */
export async function getSoggyByAchievementId(
    achievementId
) {
    const soggies = await getAllSoggies();

    return soggies.find(
        (soggy) =>
            soggy.obtainable?.achievement === true &&
            soggy.obtainable?.achievementId === achievementId
    ) ?? null;
}

/**
 * choose a random wheel-obtainable soggy
 * from a rarity
 */
export async function getRandomWheelSoggy(
    rarity
) {
    const pool = await getWheelSoggiesByRarity(
        rarity
    );

    if (pool.length === 0) {
        return null;
    }

    const index = Math.floor(
        Math.random() * pool.length
    );

    return pool[index];
}

/**
 * choose a random anomaly
 */
export async function getRandomAnomaly() {
    const anomalies = await getAnomalies();

    if (anomalies.length === 0) {
        return null;
    }

    const index = Math.floor(
        Math.random() * anomalies.length
    );

    return anomalies[index];
}

/**
 * get the number of public soggies
 */
export async function getDexSize() {
    const soggies = await getVisibleSoggies();

    return soggies.length;
}

/**
 * get the number of hidden anomalies
 */
export async function getAnomalyCount() {
    const anomalies = await getAnomalies();

    return anomalies.length;
}

/**
 * get total number of soggies,
 * including anomalies
 */
export async function getTotalSoggyCount() {
    const soggies = await getAllSoggies();

    return soggies.length;
}

/**
 * calculate a specific soggy's actual chance
 * from a rarity chance and pool size
 *
 * example:
 * legendary rarity = 1%
 * 10 legendary soggies
 *
 * individual chance = 0.1%
 */
export async function calculateIndividualChance(
    soggy,
    rarityChance
) {
    if (
        !soggy ||
        soggy.hidden === true ||
        soggy.rarity === "anomaly"
    ) {
        return null;
    }

    const pool = await getWheelSoggiesByRarity(
        soggy.rarity
    );

    if (pool.length === 0) {
        return null;
    }

    return rarityChance / pool.length;
}

/**
 * convert percentage chance into "1 in x" odds
 *
 * 0.2 -> 1 in 500
 */
export function chanceToOdds(chance) {
    if (
        !Number.isFinite(chance) ||
        chance <= 0
    ) {
        return null;
    }

    return Math.round(
        100 / chance
    );
}

/**
 * format a percentage nicely
 */
export function formatSoggyChance(chance) {
    if (
        !Number.isFinite(chance) ||
        chance <= 0
    ) {
        return "???";
    }

    if (chance >= 1) {
        return `${Number(
            chance.toFixed(2)
        )}%`;
    }

    if (chance >= 0.01) {
        return `${Number(
            chance.toFixed(4)
        )}%`;
    }

    return `${Number(
        chance.toFixed(6)
    )}%`;
}

/**
 * format odds as "1 in 5,000"
 */
export function formatSoggyOdds(chance) {
    const odds = chanceToOdds(chance);

    if (!odds) {
        return "???";
    }

    return `1 in ${odds.toLocaleString("en-US")}`;
}

/**
 * verify that an image path exists in the soggy object
 */
export function hasSoggyImage(soggy) {
    return Boolean(
        soggy?.image &&
        typeof soggy.image === "string"
    );
}

/**
 * get a fallback display name
 */
export function getSoggyDisplayName(soggy) {
    return soggy?.name ?? "unknown soggy";
}

/**
 * get a safe rarity id
 */
export function getSoggyRarity(soggy) {
    return soggy?.rarity ?? "unknown";
}

/**
 * basic validation for one soggy entry
 */
export function validateSoggy(soggy) {
    if (!soggy || typeof soggy !== "object") {
        return false;
    }

    if (
        typeof soggy.id !== "string" ||
        soggy.id.length === 0
    ) {
        return false;
    }

    if (
        typeof soggy.name !== "string" ||
        soggy.name.length === 0
    ) {
        return false;
    }

    if (
        typeof soggy.rarity !== "string" ||
        soggy.rarity.length === 0
    ) {
        return false;
    }

    if (
        typeof soggy.image !== "string" ||
        soggy.image.length === 0
    ) {
        return false;
    }

    return true;
}

/**
 * validate all loaded soggies
 */
export async function validateAllSoggies() {
    const soggies = await getAllSoggies();

    const invalid = soggies.filter(
        (soggy) => !validateSoggy(soggy)
    );

    return {
        valid: invalid.length === 0,
        total: soggies.length,
        invalid
    };
}
