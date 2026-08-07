// !!! | initializes every page, highlights navigation, updates the balance, and displays toast notifications, AKA REALLY IMPORTANT

import {
    getPlayer
} from "./storage.js";

import {
    renderBalance
} from "./balance.js";

function setActiveNavigationLink() {
    const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
        const linkPath = new URL(link.href).pathname.replace(/\/$/, "") || "/";

        link.classList.toggle("is-active", linkPath === currentPath);
    });
}

function ensureToastContainer() {
    let container = document.querySelector(".toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.append(container);
    }

    return container;
}

export function showToast(message, type = "default") {
    const container = ensureToastContainer();
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.append(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3500);
}

function initializeApp() {
    getPlayer();
    renderBalance();
    setActiveNavigationLink();

    window.addEventListener("soggybet:player-updated", () => {
        renderBalance();
    });
}

document.addEventListener("DOMContentLoaded", initializeApp);
