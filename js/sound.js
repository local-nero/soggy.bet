// !!! | handles every sound effect in soggybet

import {
    getPlayer
} from "/js/storage.js";

const soundPaths = {

    wheelSpin:
        "/assets/audio/wheel-spin.mp3",

    wheelStop:
        "/assets/audio/wheel-stop.mp3",

    legendary:
        "/assets/audio/legendary.mp3",

    mythic:
        "/assets/audio/mythic.mp3",

    ultra:
        "/assets/audio/ultra.mp3",

    anomaly:
        "/assets/audio/anomaly.mp3",

    flash:
        "/assets/audio/flash.mp3",

    cardReveal:
        "/assets/audio/card-reveal.mp3"

};


/*
    master cache

    used for looping sounds
    (wheel spin)
*/

const cache = {};


/* =========================================================
   helpers
   ========================================================= */

function soundsEnabled() {

    const player =
        getPlayer();

    return (
        player.settings?.sound !==
        false
    );

}


/* =========================================================
   playback
   ========================================================= */

export function playSound(
    name,
    {
        volume = 1,
        loop = false
    } = {}
) {

    if (!soundsEnabled()) {
        return;
    }

    const path =
        soundPaths[name];

    if (!path) {
        return;
    }


    /*
        looping sounds
        reuse one instance
    */

    if (loop) {

        let audio =
            cache[name];

        if (!audio) {

            audio =
                new Audio(path);

            cache[name] =
                audio;

        }

        audio.pause();

        audio.currentTime =
            0;

        audio.volume =
            volume;

        audio.loop =
            true;

        audio.play().catch(
            () => {}
        );

        return;

    }


    /*
        one-shot sounds

        clone so multiple
        can overlap
    */

    const audio =
        new Audio(path);

    audio.volume =
        volume;

    audio.play().catch(
        () => {}
    );

}


/* =========================================================
   stop
   ========================================================= */

export function stopSound(
    name
) {

    const audio =
        cache[name];

    if (!audio) {
        return;
    }

    audio.pause();

    audio.currentTime =
        0;

}


/* =========================================================
   fade out
   ========================================================= */

export function fadeOutSound(
    name,
    duration = 200
) {

    const audio =
        cache[name];

    if (!audio) {
        return;
    }

    const startVolume =
        audio.volume;

    const start =
        performance.now();

    function tick(now) {

        const progress =
            Math.min(
                1,
                (now - start) /
                duration
            );

        audio.volume =
            startVolume *
            (1 - progress);

        if (progress < 1) {

            requestAnimationFrame(
                tick
            );

            return;

        }

        audio.pause();

        audio.currentTime =
            0;

        audio.volume =
            startVolume;

    }

    requestAnimationFrame(
        tick
    );

}
