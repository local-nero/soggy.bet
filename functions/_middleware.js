const PUBLIC_PATHS = new Set([
    "/unlock",
    "/unlock/",
    "/unlock.html"
]);

const PUBLIC_PREFIXES = [
    "/css/",
    "/assets/branding/"
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

    const cookies =
        cookieHeader.split(";");

    for (const cookie of cookies) {
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

    const expectedToken =
        env.SITE_ACCESS_TOKEN;

    if (!expectedToken) {
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

    const currentToken =
        getCookie(
            request,
            "soggybet_access"
        );

    if (currentToken === expectedToken) {
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
