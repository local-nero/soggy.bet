// handles checking, adding, subtracting, formatting, and displaying SoggyCoins

import {
    getPlayer,
    updatePlayer
} from "./storage.js";

export function getBalance() {
    return getPlayer().balance;
}

export function canAfford(amount) {
    return getBalance() >= amount;
}

export function addBalance(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Balance amount must be greater than zero.");
    }

    return updatePlayer((player) => {
        player.balance += Math.floor(amount);
        return player;
    });
}

export function subtractBalance(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Balance amount must be greater than zero.");
    }

    if (!canAfford(amount)) {
        return false;
    }

    updatePlayer((player) => {
        player.balance -= Math.floor(amount);
        return player;
    });

    return true;
}

export function formatSoggyCoins(amount) {
    return new Intl.NumberFormat("en-US").format(
        Math.max(0, Math.floor(amount))
    );
}

export function renderBalance() {
    const balance = formatSoggyCoins(getBalance());

    document.querySelectorAll("[data-balance]").forEach((element) => {
        element.textContent = balance;
    });
}
