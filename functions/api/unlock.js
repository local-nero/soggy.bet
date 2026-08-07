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

function redirect(location, status = 303, cookie = null) {
    const headers = new Headers();

    headers.set(
        "Location",
        location
    );

    headers.set(
        "Cache-Control",
        "no-store"
    );

    if (cookie) {
        headers.set(
            "Set-Cookie",
            cookie
        );
    }

    return new Response(
        null,
        {
            status,
            headers
        }
    );
}


/*
    visiting /api/unlock directly isn't useful,
    so send the user to the actual unlock page.
*/

export async function onRequestGet(context) {
    const url =
        new URL(
            context.request.url
        );

    return redirect(
        new URL(
            "/unlock.html",
            url
        ).toString(),
        302
    );
}


/*
    password submission
*/

export async function onRequestPost(context) {
    const {
        request,
        env
    } = context;

    /*
        make sure cloudflare has both secrets
    */

    if (
        !env.SITE_PASSWORD ||
        !env.SITE_ACCESS_TOKEN
    ) {
        return new Response(
            "soggybet access is not configured.",
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8",

                    "Cache-Control":
                        "no-store"
                }
            }
        );
    }


    let form;

    try {
        form =
            await request.formData();
    }

    catch (error) {
        console.error(
            "[soggybet] failed to read unlock form:",
            error
        );

        return new Response(
            "invalid unlock request.",
            {
                status: 400,

                headers: {
                    "Cache-Control":
                        "no-store"
                }
            }
        );
    }


    const password =
        String(
            form.get("password") ??
            ""
        );


    const next =
        safeNextPath(
            String(
                form.get("next") ??
                "/"
            )
        );


    /*
        wrong password
    */

    if (
        password !==
        env.SITE_PASSWORD
    ) {
        const failureUrl =
            new URL(
                "/unlock.html",
                request.url
            );

        failureUrl.searchParams.set(
            "error",
            "1"
        );

        failureUrl.searchParams.set(
            "next",
            next
        );

        return redirect(
            failureUrl.toString()
        );
    }


    /*
        correct password

        cookie lasts 7 days.
        password itself is never stored in the browser.
    */

    const cookie = [
        `soggybet_access=${encodeURIComponent(
            env.SITE_ACCESS_TOKEN
        )}`,

        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",

        /*
            7 days
        */

        "Max-Age=604800"
    ].join("; ");


    const destination =
        new URL(
            next,
            request.url
        );


    return redirect(
        destination.toString(),
        303,
        cookie
    );
}
