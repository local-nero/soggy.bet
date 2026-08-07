import {
    getPlayer
} from "/js/storage.js";


const sounds = {
    wheelSpin:
        new Audio(
            "/assets/audio/wheel-spin.mp3"
        ),

    wheelStop:
        new Audio(
            "/assets/audio/wheel-stop.mp3"
        ),

    reveal:
        new Audio(
            "/assets/audio/reveal.mp3"
        ),

    mythic:
        new Audio(
            "/assets/audio/mythic.mp3"
        ),

    legendary:
        new Audio(
            "/assets/audio/legendary.mp3"
        ),

    ultra:
        new Audio(
            "/assets/audio/ultra.mp3"
        ),

    anomaly:
        new Audio(
            "/assets/audio/anomaly.mp3"
        )
};


export function playSound(
    name,
    {
        volume = 1,
        loop = false
    } = {}
) {
    const player =
        getPlayer();

    if (
        player.settings?.sound ===
        false
    ) {
        return;
    }

    const sound =
        sounds[name];

    if (!sound) {
        return;
    }

    sound.pause();

    sound.currentTime = 0;

    sound.volume =
        Math.max(
            0,
            Math.min(
                1,
                volume
            )
        );

    sound.loop =
        loop;

    sound.play().catch(
        () => {}
    );
}


export function stopSound(
    name
) {
    const sound =
        sounds[name];

    if (!sound) {
        return;
    }

    sound.pause();

    sound.currentTime = 0;
}
