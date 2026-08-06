// Nothing here but us soggies

import {
    exportPlayerSave,
    getPlayer,
    importPlayerSave,
    resetPlayer,
    updatePlayer
} from "/js/storage.js";

import {
    showToast
} from "/js/app.js";


const usernameInput =
    document.querySelector(
        "#username-input"
    );

const saveUsername =
    document.querySelector(
        "#save-username"
    );


const cutsceneOptions =
    document.querySelectorAll(
        "[data-cutscene]"
    );


const soundToggle =
    document.querySelector(
        "#sound-toggle"
    );

const animationsToggle =
    document.querySelector(
        "#animations-toggle"
    );

const confirmSellingToggle =
    document.querySelector(
        "#confirm-selling-toggle"
    );


const grassTime =
    document.querySelector(
        "#grass-time"
    );

const touchGrassButton =
    document.querySelector(
        "#touch-grass-button"
    );


const exportButton =
    document.querySelector(
        "#export-save"
    );

const importInput =
    document.querySelector(
        "#import-save"
    );

const resetButton =
    document.querySelector(
        "#reset-save"
    );


function normalizeUsername(value) {
    return value
        .trim()
        .replace(/\s+/g, " ");
}


function saveName() {
    const username =
        normalizeUsername(
            usernameInput.value
        );


    if (username.length < 2) {
        showToast(
            "username must be at least 2 characters.",
            "error"
        );

        return;
    }


    if (username.length > 20) {
        showToast(
            "username cannot exceed 20 characters.",
            "error"
        );

        return;
    }


    updatePlayer((player) => {
        player.username =
            username;

        return player;
    });


    showToast(
        `you are now ${username}.`,
        "success"
    );


    renderSettings();
}


function setCutsceneMode(mode) {
    updatePlayer((player) => {
        player.settings.cutscenes =
            mode;

        return player;
    });


    renderSettings();
}


function saveToggles() {
    updatePlayer((player) => {
        player.settings.sound =
            soundToggle.checked;

        player.settings.animations =
            animationsToggle.checked;

        player.settings.confirmSelling =
            confirmSellingToggle.checked;

        return player;
    });
}


function formatDuration(milliseconds) {
    const totalSeconds =
        Math.max(
            0,
            Math.floor(
                milliseconds / 1000
            )
        );


    const days =
        Math.floor(
            totalSeconds /
            86400
        );


    const hours =
        Math.floor(
            (
                totalSeconds %
                86400
            ) /
            3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            ) /
            60
        );


    const seconds =
        totalSeconds %
        60;


    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }


    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }


    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }


    return `${seconds}s`;
}


function updateGrassTimer() {
    if (!grassTime) {
        return;
    }


    const player =
        getPlayer();


    const start =
        player.touchGrass.lastTouched ??
        player.touchGrass.startedAt ??
        Date.now();


    grassTime.textContent =
        formatDuration(
            Date.now() - start
        );
}


function touchGrass() {
    updatePlayer((player) => {
        player.touchGrass.lastTouched =
            Date.now();

        return player;
    });


    showToast(
        "grass contact recorded. alarming.",
        "success"
    );


    updateGrassTimer();
}


function exportSave() {
    const blob =
        new Blob(
            [
                exportPlayerSave()
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        "soggybet-save.json";


    link.click();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "save exported.",
        "success"
    );
}


async function importSave(event) {
    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    try {
        const text =
            await file.text();


        importPlayerSave(
            text
        );


        showToast(
            "save imported.",
            "success"
        );


        renderSettings();
    }

    catch (error) {
        console.error(error);


        showToast(
            "that save appears deeply unsogged.",
            "error"
        );
    }


    importInput.value =
        "";
}


function resetSaveData() {
    const confirmed =
        window.confirm(
            "evaporate your entire soggybet save? this cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    resetPlayer();


    showToast(
        "the puddle has been reset.",
        "success"
    );


    renderSettings();
}


function renderSettings() {
    const player =
        getPlayer();


    usernameInput.value =
        player.username;


    soundToggle.checked =
        player.settings.sound;


    animationsToggle.checked =
        player.settings.animations;


    confirmSellingToggle.checked =
        player.settings.confirmSelling;


    cutsceneOptions.forEach(
        (button) => {
            button.classList.toggle(
                "is-active",
                button.dataset.cutscene ===
                    player.settings.cutscenes
            );
        }
    );


    document
        .querySelectorAll(
            "[data-username]"
        )
        .forEach(
            (element) => {
                element.textContent =
                    player.username;
            }
        );


    updateGrassTimer();
}


saveUsername.addEventListener(
    "click",
    saveName
);


usernameInput.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Enter") {
            saveName();
        }
    }
);


cutsceneOptions.forEach(
    (button) => {
        button.addEventListener(
            "click",
            () => {
                setCutsceneMode(
                    button.dataset.cutscene
                );
            }
        );
    }
);


soundToggle.addEventListener(
    "change",
    saveToggles
);


animationsToggle.addEventListener(
    "change",
    saveToggles
);


confirmSellingToggle.addEventListener(
    "change",
    saveToggles
);


touchGrassButton.addEventListener(
    "click",
    touchGrass
);


exportButton.addEventListener(
    "click",
    exportSave
);


importInput.addEventListener(
    "change",
    importSave
);


resetButton.addEventListener(
    "click",
    resetSaveData
);


renderSettings();


window.setInterval(
    updateGrassTimer,
    1000
);
