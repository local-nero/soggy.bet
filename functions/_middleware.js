export async function onRequest(context) {
    const { request, next, env } = context;

    const authorization = request.headers.get("Authorization");

    const expectedUser = env.SITE_USER;
    const expectedPass = env.SITE_PASSWORD;

    if (!expectedUser || !expectedPass) {
        return new Response(
            "site password is not configured.",
            {
                status: 500
            }
        );
    }

    if (authorization) {
        const [scheme, encoded] = authorization.split(" ");

        if (
            scheme === "Basic" &&
            encoded
        ) {
            try {
                const decoded = atob(encoded);

                const separatorIndex = decoded.indexOf(":");

                const username = decoded.slice(
                    0,
                    separatorIndex
                );

                const password = decoded.slice(
                    separatorIndex + 1
                );

                if (
                    username === expectedUser &&
                    password === expectedPass
                ) {
                    return next();
                }
            } catch {
                // invalid authorization header
            }
        }
    }

    return new Response(
        "soggybet is currently private.",
        {
            status: 401,

            headers: {
                "WWW-Authenticate":
                    'Basic realm="soggybet", charset="UTF-8"',

                "Cache-Control":
                    "no-store"
            }
        }
    );
}
