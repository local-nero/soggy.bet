export async function onRequestPost(context) {

    try {

        const {
            soggy,
            chance,
            wheel,
            username,
            forced
        } = await context.request.json();


        const allowedRarities =
            new Set([
                "mythic",
                "ultra-legendary",
                "anomaly"
            ]);


        if (
            !soggy ||
            !allowedRarities.has(
                soggy.rarity
            )
        ) {
            return Response.json({
                ok: true,
                skipped: "rarity"
            });
        }


        if (forced) {

            return Response.json({
                ok: true,
                skipped: "forced"
            });

        }


        const rarityNames = {

            mythic:
                "MYTHIC",

            "ultra-legendary":
                "ULTRA LEGENDARY",

            anomaly:
                "████████"

        };


        const colors = {

            mythic:
                0xEF4444,

            "ultra-legendary":
                0x55EAFF,

            anomaly:
                0x050505

        };


        const rarityName =
            rarityNames[
                soggy.rarity
            ];


        const formattedValue =
            Number(
                soggy.value ?? 0
            ).toLocaleString(
                "en-US"
            );


        let odds =
            "Unknown";


        if (
            chance &&
            Number.isFinite(
                Number(chance)
            ) &&
            Number(chance) > 0
        ) {

odds =
    `1 in ${Math.round(
        100 /
        Number(chance)
    ).toLocaleString(
        "en-US"
    )}`;

        }


        const isAnomaly =
            soggy.rarity ===
            "anomaly";


        const embed = {

            color:
                colors[
                    soggy.rarity
                ],

            author: {
                name:
                    "soggybet • rare pull"
            },

            title:
                isAnomaly
                    ? "████████████"
                    : `${username || "guest"} pulled ${soggy.name}!`,

            description:
                isAnomaly
                    ? "Something that should not have been found has been found."
                    : `A **${rarityName}** soggy has been rescued from the **${wheel}** wheel.`,

            fields: [

                {
                    name:
                        "Rarity",

                    value:
                        `**${rarityName}**`,

                    inline:
                        true
                },

                {
                    name:
                        "Value",

                    value:
                        isAnomaly
                            ? "**???**"
                            : `**${formattedValue} SC**`,

                    inline:
                        true
                },

                {
                    name:
                        "Odds",

                    value:
                        isAnomaly
                            ? "**???**"
                            : `**${odds}**`,

                    inline:
                        true
                }

            ],

            footer: {
                text:
                    "soggybet • progressively wetter cats"
            },

            timestamp:
                new Date()
                    .toISOString()

        };


if (
    !isAnomaly &&
    soggy.image
) {
    const imageUrl =
        soggy.image.startsWith("http")
            ? soggy.image
            : `https://soggybet.pages.dev${soggy.image}`;

    embed.thumbnail = {
        url:
            imageUrl
    };
}

        const response =
            await fetch(
                context.env
                    .DISCORD_WEBHOOK_URL,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username:
                                "Soggybet - Global Pulls",

                            embeds: [
                                embed
                            ]
                        })
                }
            );


        if (!response.ok) {

            console.error(
                "discord webhook error:",
                response.status,
                await response.text()
            );

            return new Response(
                "webhook failed",
                {
                    status: 502
                }
            );

        }


        return Response.json({
            ok: true
        });

    }

    catch (error) {

        console.error(
            "announce pull failed:",
            error
        );

        return new Response(
            "internal error",
            {
                status: 500
            }
        );

    }

}
