function safeNextPath(value) {
    if (
        typeof value !== "string" ||
        !value.startsWith("/") ||
        value.startsWith("//")
    ) {
        return "/";
    }

    return value;
}

export async function onRequestPost(context) {
    const {
        request,
        env
    } = context;

    const form =
        await request.formData();

    const password =
        String(
            form.get("password") ?? ""
        );

    const next =
        safeNextPath(
            String(
                form.get("next") ?? "/"
            )
        );

    if (
        !env.SITE_PASSWORD ||
        !env.SITE_ACCESS_TOKEN
    ) {
        return new Response(
            "soggybet access is not configured.",
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );
    }

    if (
        password !==
        env.SITE_PASSWORD
    ) {
        const redirect =
            new URL(
                "/unlock",
                request.url
            );

        redirect.searchParams.set(
            "error",
            "1"
        );

        redirect.searchParams.set(
            "next",
            next
        );

        return Response.redirect(
            redirect.toString(),
            303
        );
    }

    const response =
        Response.redirect(
            new URL(
                next,
                request.url
            ).toString(),
            303
        );

    response.headers.append(
        "Set-Cookie",
        [
            `soggybet_access=${encodeURIComponent(
                env.SITE_ACCESS_TOKEN
            )}`,
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Lax",
            "Max-Age=604800"
        ].join("; ")
    );

    return response;
}
