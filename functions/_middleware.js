const PUBLIC_PATHS = new Set([
    "/unlock",
    "/unlock/",
    "/unlock.html",
    "/api/unlock"
]);

const PUBLIC_PREFIXES = [
    "/css/",
    "/assets/branding/",
    "/assets/fonts/"
];

function isPublicPath(pathname) {
    if (PUBLIC_PATHS.has(pathname)) {
        return true;
    }

    return PUBLIC_PREFIXES.some(
        (prefix) => pathname.startsWith(prefix)
    );
}

function getCookie(request, name) {
    const cookieHeader =
        request.headers.get("Cookie") ?? "";

    for (const cookie of cookieHeader.split(";")) {
        const [key, ...valueParts] =
            cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(
                valueParts.join("=")
            );
        }
    }

    return null;
}

export async function onRequest(context) {
    const {
        request,
        next,
        env
    } = context;

    const url =
        new URL(request.url);

    if (isPublicPath(url.pathname)) {
        return next();
    }

    if (!env.SITE_ACCESS_TOKEN) {
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

    const accessToken =
        getCookie(
            request,
            "soggybet_access"
        );

    if (
        accessToken ===
        env.SITE_ACCESS_TOKEN
    ) {
        return next();
    }

    const redirect =
        new URL(
            "/unlock",
            request.url
        );

    redirect.searchParams.set(
        "next",
        url.pathname + url.search
    );

    return Response.redirect(
        redirect.toString(),
        302
    );
}
