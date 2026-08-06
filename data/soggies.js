// sog

let soggyCache = null;

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
        throw new Error("soggies.json must contain an array.");
    }

    soggyCache = data;

    return soggyCache;
}

export async function getSoggyById(id) {
    const soggies = await getAllSoggies();

    return soggies.find(
        (soggy) => soggy.id === id
    ) ?? null;
}

export async function getSoggiesByRarity(rarity) {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) =>
            soggy.rarity === rarity &&
            !soggy.hidden
    );
}

export async function getWheelSoggiesByRarity(rarity) {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) =>
            soggy.rarity === rarity &&
            soggy.obtainable?.wheel === true &&
            !soggy.hidden
    );
}

export async function getVisibleSoggies() {
    const soggies = await getAllSoggies();

    return soggies
        .filter((soggy) => !soggy.hidden)
        .sort((a, b) => {
            return (a.dex ?? Infinity) - (b.dex ?? Infinity);
        });
}

export async function getAnomalies() {
    const soggies = await getAllSoggies();

    return soggies.filter(
        (soggy) =>
            soggy.hidden === true &&
            soggy.rarity === "anomaly"
    );
}

export function clearSoggyCache() {
    soggyCache = null;
}
