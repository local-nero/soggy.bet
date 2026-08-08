// Nothing here but us soggies

// !!! | inventory v2

import {
    getPlayer,
    updatePlayer
} from "/js/storage.js";

import {
    addBalance,
    formatSoggyCoins
} from "/js/balance.js";

import {
    getSoggyById
} from "/js/soggies.js";

import {
    showToast
} from "/js/app.js";


/* =========================================================
   dom
   ========================================================= */

const inventoryGrid =
    document.querySelector(
        "#inventory-grid"
    );

const inventoryEmpty =
    document.querySelector(
        "#inventory-empty"
    );

const searchInput =
    document.querySelector(
        "#inventory-search"
    );

const sortSelect =
    document.querySelector(
        "#inventory-sort"
    );

const filterButtons =
    document.querySelectorAll(
        "[data-rarity-filter]"
    );


const totalOwnedValue =
    document.querySelector(
        "#inventory-total-owned"
    );

const uniqueValue =
    document.querySelector(
        "#inventory-unique"
    );

const totalValue =
    document.querySelector(
        "#inventory-total-value"
    );

const favoritesValue =
    document.querySelector(
        "#inventory-favorites"
    );


/* inspect */

const inspectDialog =
    document.querySelector(
        "#inventory-inspect"
    );

const inspectClose =
    document.querySelector(
        "#inventory-inspect-close"
    );

const inspectImage =
    document.querySelector(
        "#inventory-inspect-image"
    );

const inspectRarity =
    document.querySelector(
        "#inventory-inspect-rarity"
    );

const inspectName =
    document.querySelector(
        "#inventory-inspect-name"
    );

const inspectDescription =
    document.querySelector(
        "#inventory-inspect-description"
    );

const inspectCopies =
    document.querySelector(
        "#inventory-inspect-copies"
    );

const inspectValue =
    document.querySelector(
        "#inventory-inspect-value"
    );

const inspectTotal =
    document.querySelector(
        "#inventory-inspect-total"
    );

const inspectDate =
    document.querySelector(
        "#inventory-inspect-date"
    );


/* =========================================================
   state
   ========================================================= */

let activeFilter =
    "all";

let searchQuery =
    "";

let sortMode =
    "newest";

let groupedInventory =
    [];


/* =========================================================
   player shape
   ========================================================= */

function ensureInventoryShape(player) {

    if (
        !Array.isArray(
            player.inventory
        )
    ) {
        player.inventory = [];
    }

    if (
        !Array.isArray(
            player.favorites
        )
    ) {
        player.favorites = [];
    }

    return player;
}


/* =========================================================
   inventory grouping
   ========================================================= */

async function buildGroupedInventory() {

    const player =
        ensureInventoryShape(
            getPlayer()
        );

    const groups =
        new Map();


    for (
        const instance
        of player.inventory
    ) {

        if (
            !instance?.soggyId
        ) {
            continue;
        }


        if (
            !groups.has(
                instance.soggyId
            )
        ) {

            groups.set(
                instance.soggyId,
                {
                    soggyId:
                        instance.soggyId,

                    instances:
                        []
                }
            );

        }


        groups
            .get(
                instance.soggyId
            )
            .instances
            .push(
                instance
            );

    }


    const output = [];


    for (
        const group
        of groups.values()
    ) {

        const soggy =
            await getSoggyById(
                group.soggyId
            );

        if (!soggy) {
            continue;
        }


        const timestamps =
            group.instances
                .map(
                    (instance) =>
                        Number(
                            instance.obtainedAt ??
                            0
                        )
                )
                .filter(
                    Number.isFinite
                );


        const newest =
            timestamps.length
                ? Math.max(
                    ...timestamps
                )
                : 0;


        const oldest =
            timestamps.length
                ? Math.min(
                    ...timestamps
                )
                : 0;


        output.push({

            soggy,

            instances:
                group.instances,

            copies:
                group.instances.length,

            newest,

            oldest,

            favorite:
                player.favorites.includes(
                    soggy.id
                )

        });

    }


    groupedInventory =
        output;

}


/* =========================================================
   filters
   ========================================================= */

function getVisibleInventory() {

    let items =
        [...groupedInventory];


    /*
        search
    */

    if (searchQuery) {

        items =
            items.filter(
                (entry) => {

                    const name =
                        entry.soggy.name
                            ?.toLowerCase() ??
                        "";

                    const description =
                        entry.soggy.description
                            ?.toLowerCase() ??
                        "";

                    return (
                        name.includes(
                            searchQuery
                        ) ||
                        description.includes(
                            searchQuery
                        )
                    );

                }
            );

    }


    /*
        rarity filter
    */

    if (
        activeFilter ===
        "favorites"
    ) {

        items =
            items.filter(
                (entry) =>
                    entry.favorite
            );

    }

    else if (
        activeFilter !==
        "all"
    ) {

        items =
            items.filter(
                (entry) =>
                    entry.soggy.rarity ===
                    activeFilter
            );

    }


    /*
        sorting
    */

    items.sort(
        (a, b) => {

            switch (sortMode) {

                case "oldest":
                    return (
                        a.oldest -
                        b.oldest
                    );


                case "value-high":
                    return (
                        Number(
                            b.soggy.value ??
                            0
                        ) -
                        Number(
                            a.soggy.value ??
                            0
                        )
                    );


                case "value-low":
                    return (
                        Number(
                            a.soggy.value ??
                            0
                        ) -
                        Number(
                            b.soggy.value ??
                            0
                        )
                    );


                case "name":
                    return (
                        a.soggy.name ??
                        ""
                    ).localeCompare(
                        b.soggy.name ??
                        ""
                    );


                case "copies":
                    return (
                        b.copies -
                        a.copies
                    );


                case "newest":
                default:
                    return (
                        b.newest -
                        a.newest
                    );

            }

        }
    );


    return items;

}


/* =========================================================
   stats
   ========================================================= */

function renderStats() {

    const player =
        ensureInventoryShape(
            getPlayer()
        );


    const totalOwned =
        player.inventory.length;


    const unique =
        groupedInventory.length;


    const value =
        groupedInventory.reduce(
            (
                total,
                entry
            ) => {

                return (
                    total +
                    (
                        Number(
                            entry.soggy.value ??
                            0
                        ) *
                        entry.copies
                    )
                );

            },
            0
        );


    const favorites =
        groupedInventory.filter(
            (entry) =>
                entry.favorite
        ).length;


    totalOwnedValue.textContent =
        totalOwned.toLocaleString();


    uniqueValue.textContent =
        unique.toLocaleString();


    totalValue.textContent =
        `${formatSoggyCoins(
            value
        )} sc`;


    favoritesValue.textContent =
        favorites.toLocaleString();

}


/* =========================================================
   favorite
   ========================================================= */

function toggleFavorite(id) {

    updatePlayer(
        (player) => {

            ensureInventoryShape(
                player
            );


            const exists =
                player.favorites.includes(
                    id
                );


            if (exists) {

                player.favorites =
                    player.favorites.filter(
                        (favoriteId) =>
                            favoriteId !== id
                    );

            }

            else {

                player.favorites.push(
                    id
                );

            }


            return player;

        }
    );

}


/* =========================================================
   sell
   ========================================================= */

function sellOne(entry) {

    const soggy =
        entry.soggy;


    updatePlayer(
        (player) => {

            ensureInventoryShape(
                player
            );


            const index =
                player.inventory.findIndex(
                    (instance) =>
                        instance.soggyId ===
                        soggy.id
                );


            if (
                index === -1
            ) {
                return player;
            }


            player.inventory.splice(
                index,
                1
            );


            if (
                player.statistics
            ) {

                player.statistics
                    .soggiesSold ??=
                    0;

                player.statistics
                    .totalWon ??=
                    0;

                player.statistics
                    .soggiesSold +=
                    1;

                player.statistics
                    .totalWon +=
                    Number(
                        soggy.value ??
                        0
                    );

            }


            return player;

        }
    );


    addBalance(
        Number(
            soggy.value ??
            0
        )
    );


    showToast(
        `${soggy.name} was released for ${formatSoggyCoins(
            soggy.value
        )} sc.`,
        "success"
    );


    refreshInventory();

}


/* =========================================================
   inspect
   ========================================================= */

function openInspect(entry) {

    const soggy =
        entry.soggy;


    inspectImage.src =
        soggy.image;


    inspectImage.alt =
        soggy.name;


    inspectRarity.textContent =
        soggy.rarity
            .replaceAll(
                "-",
                " "
            );


    inspectName.textContent =
        soggy.name;


    inspectDescription.textContent =
        soggy.description ??
        "a suspiciously undocumented soggy.";


    inspectCopies.textContent =
        entry.copies.toLocaleString();


    inspectValue.textContent =
        `${formatSoggyCoins(
            soggy.value
        )} sc`;


    inspectTotal.textContent =
        `${formatSoggyCoins(
            Number(
                soggy.value ??
                0
            ) *
            entry.copies
        )} sc`;


    inspectDate.textContent =
        entry.oldest
            ? new Intl.DateTimeFormat(
                "en",
                {
                    year:
                        "numeric",

                    month:
                        "short",

                    day:
                        "numeric"
                }
            ).format(
                new Date(
                    entry.oldest
                )
            )
            : "unknown";


    inspectDialog.showModal();

}


/* =========================================================
   cards
   ========================================================= */

function createCard(
    entry,
    index
) {

    const soggy =
        entry.soggy;


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "inventory-card";


    /*
        image
    */

    const imageShell =
        document.createElement(
            "div"
        );

    imageShell.className =
        "inventory-card-image-shell";


    const image =
        document.createElement(
            "img"
        );

    image.className =
        "inventory-card-image";

    image.src =
        soggy.image;

    image.alt =
        soggy.name;

    image.loading =
        "lazy";


    const count =
        document.createElement(
            "span"
        );

    count.className =
        "inventory-card-count";

    count.textContent =
        `×${entry.copies}`;


    const favorite =
        document.createElement(
            "button"
        );

    favorite.type =
        "button";

    favorite.className =
        "inventory-favorite";

    favorite.textContent =
        "★";


    favorite.classList.toggle(
        "is-active",
        entry.favorite
    );


    favorite.addEventListener(
        "click",
        async () => {

            toggleFavorite(
                soggy.id
            );

            await refreshInventory();

        }
    );


    imageShell.append(
        image,
        count,
        favorite
    );


    /*
        body
    */

    const body =
        document.createElement(
            "div"
        );

    body.className =
        "inventory-card-body";


    const topline =
        document.createElement(
            "div"
        );

    topline.className =
        "inventory-card-topline";


    const number =
        document.createElement(
            "span"
        );

    number.className =
        "inventory-card-number";

    number.textContent =
        `#${String(
            soggy.dexNumber ??
            index + 1
        ).padStart(
            3,
            "0"
        )}`;


    const rarity =
        document.createElement(
            "span"
        );

    rarity.className =
        `inventory-rarity ${soggy.rarity}`;

    rarity.textContent =
        soggy.rarity
            .replaceAll(
                "-",
                " "
            );


    topline.append(
        number,
        rarity
    );


    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        soggy.name;


    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "inventory-card-meta";


    const copies =
        document.createElement(
            "span"
        );

    copies.textContent =
        `${entry.copies} owned`;


    const value =
        document.createElement(
            "strong"
        );

    value.textContent =
        `${formatSoggyCoins(
            soggy.value
        )} sc`;


    meta.append(
        copies,
        value
    );


    /*
        actions
    */

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "inventory-card-actions";


    const inspect =
        document.createElement(
            "button"
        );

    inspect.type =
        "button";

    inspect.className =
        "inventory-card-button";

    inspect.textContent =
        "inspect";


    inspect.addEventListener(
        "click",
        () => {

            openInspect(
                entry
            );

        }
    );


    const sell =
        document.createElement(
            "button"
        );

    sell.type =
        "button";

    sell.className =
        "inventory-card-button sell";

    sell.textContent =
        "sell 1";


    sell.addEventListener(
        "click",
        () => {

            sellOne(
                entry
            );

        }
    );


    actions.append(
        inspect,
        sell
    );


    body.append(
        topline,
        title,
        meta,
        actions
    );


    card.append(
        imageShell,
        body
    );


    return card;

}


/* =========================================================
   rendering
   ========================================================= */

function renderInventory() {

    inventoryGrid.replaceChildren();


    const visible =
        getVisibleInventory();


    inventoryEmpty.hidden =
        visible.length > 0;


    if (
        !visible.length
    ) {
        return;
    }


    const fragment =
        document.createDocumentFragment();


    visible.forEach(
        (
            entry,
            index
        ) => {

            fragment.append(
                createCard(
                    entry,
                    index
                )
            );

        }
    );


    inventoryGrid.append(
        fragment
    );

}


/* =========================================================
   refresh
   ========================================================= */

async function refreshInventory() {

    await buildGroupedInventory();

    renderStats();

    renderInventory();

}


/* =========================================================
   events
   ========================================================= */

searchInput.addEventListener(
    "input",
    () => {

        searchQuery =
            searchInput.value
                .trim()
                .toLowerCase();

        renderInventory();

    }
);


sortSelect.addEventListener(
    "change",
    () => {

        sortMode =
            sortSelect.value;

        renderInventory();

    }
);


filterButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                activeFilter =
                    button.dataset
                        .rarityFilter;


                filterButtons.forEach(
                    (other) => {

                        other.classList.toggle(
                            "is-active",
                            other ===
                            button
                        );

                    }
                );


                renderInventory();

            }
        );

    }
);


inspectClose.addEventListener(
    "click",
    () => {

        inspectDialog.close();

    }
);


inspectDialog.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            inspectDialog
        ) {
            inspectDialog.close();
        }

    }
);


window.addEventListener(
    "soggybet:player-updated",
    () => {

        refreshInventory();

    }
);


/* =========================================================
   init
   ========================================================= */

refreshInventory().catch(
    (error) => {

        console.error(
            "[soggybet] inventory failed:",
            error
        );


        showToast(
            "the sogs failed to organize themselves.",
            "error"
        );

    }
);
