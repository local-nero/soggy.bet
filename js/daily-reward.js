import { getPlayer, updatePlayer } from "./storage.js";

const button = document.querySelector("#daily-reward-button");

if (button) {
    updateButton();

    button.addEventListener("click", claimReward);
}

function claimReward() {
    const player = getPlayer();

    const now = Date.now();

    const last =
        player.dailyReward?.lastClaimed ?? 0;

    const cooldown =
        24 * 60 * 60 * 1000;

    if (now - last < cooldown) {
        updateButton();
        return;
    }

    updatePlayer((player) => {
        player.balance += 500;

        player.dailyReward.lastClaimed = now;

        player.statistics.dailyPuddlesClaimed++;

        return player;
    });

    updateButton();

    window.dispatchEvent(
        new Event("soggybet:balance")
    );
}

function updateButton() {
    const player = getPlayer();

    const now = Date.now();

    const last =
        player.dailyReward?.lastClaimed ?? 0;

    const cooldown =
        24 * 60 * 60 * 1000;

    const remaining =
        cooldown - (now - last);

    if (remaining <= 0) {
        button.disabled = false;

        button.textContent =
            "claim 500 sc";

        return;
    }

    button.disabled = true;

    const hours =
        Math.floor(
            remaining / 3600000
        );

    const minutes =
        Math.floor(
            (remaining % 3600000) /
            60000
        );

    button.textContent =
        `${hours}h ${minutes}m`;
}

setInterval(
    updateButton,
    30000
);
