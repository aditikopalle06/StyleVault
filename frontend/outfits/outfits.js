// ============================================
// MY OUTFITS
// ============================================



const token = localStorage.getItem("token");



if (!token) {

    window.location.href = "../login/login.html";

}



// ============================================
// VARIABLES
// ============================================



let outfits = [];

let activeFilter = "all";

let searchText = "";



// ============================================
// DOM ELEMENTS
// ============================================



const outfitsGrid =
    document.getElementById("outfitsGrid");



const emptyState =
    document.getElementById("emptyState");



const noResults =
    document.getElementById("noResults");



const searchInput =
    document.getElementById("searchInput");



// ============================================
// LOAD USER
// ============================================



function loadUser() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem("user")
            );


        if (user) {

            const name =
                user.name ||
                user.username ||
                "Fashion Muse";


            const profileName =
                document.getElementById(
                    "profileName"
                );


            if (profileName) {

                profileName.textContent = name;

            }

        }

    } catch (error) {

        console.log(
            "Could not load user"
        );

    }

}



// ============================================
// LOAD OUTFITS
// ============================================



async function loadOutfits() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/outfits",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "token"
            );


            window.location.href =
                "../login/login.html";


            return;

        }


        if (!response.ok) {

            throw new Error(
                "Failed to load outfits."
            );

        }


        const data =
            await response.json();


        outfits =
            Array.isArray(data)
                ? data
                : data.outfits || [];


        renderOutfits();


    } catch (error) {

        console.error(
            "Error loading outfits:",
            error
        );


        outfitsGrid.innerHTML = `

            <div class="outfits-error">

                <span class="material-symbols-outlined">
                    error
                </span>

                <p>
                    Could not load your outfits.
                </p>

                <button
                    onclick="loadOutfits()"
                >
                    Try Again
                </button>

            </div>

        `;

    }

}



// ============================================
// FILTER OUTFITS
// ============================================



function getFilteredOutfits() {

    return outfits.filter(outfit => {


        // =================================
        // SEARCH
        // =================================


        const items =
            Array.isArray(
                outfit.items
            )
                ? outfit.items
                : [];


        const itemText =
            items
                .map(item =>
                    [
                        item.name,
                        item.category,
                        item.colour,
                        item.season,
                        item.occasion
                    ]
                        .filter(Boolean)
                        .join(" ")
                )
                .join(" ");


        const searchableText =
            [
                outfit.outfit_name,
                outfit.occasion,
                itemText
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


        if (
            searchText &&
            !searchableText.includes(
                searchText
            )
        ) {

            return false;

        }



        // =================================
        // OCCASION FILTER
        // =================================


        if (
            activeFilter === "all"
        ) {

            return true;

        }


        const occasion =
            (
                outfit.occasion ||
                ""
            )
                .trim()
                .toLowerCase();


        /*
            The filter buttons use:

            Casual
            Work
            Evening
            Festive
            Travel
            Party

            We compare the saved occasion
            directly with the selected filter.
        */


        return (
            occasion ===
            activeFilter
                .trim()
                .toLowerCase()
        );

    });

}



// ============================================
// RENDER OUTFITS
// ============================================



function renderOutfits() {

    const filteredOutfits =
        getFilteredOutfits();


    outfitsGrid.innerHTML = "";



    // =========================================
    // EMPTY STATE
    // =========================================


    if (
        outfits.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }


        if (noResults) {

            noResults.classList.add(
                "hidden"
            );

        }


        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }



    // =========================================
    // NO SEARCH RESULTS
    // =========================================


    if (
        filteredOutfits.length === 0
    ) {

        if (noResults) {

            noResults.classList.remove(
                "hidden"
            );

        }


        return;

    }


    if (noResults) {

        noResults.classList.add(
            "hidden"
        );

    }



    // =========================================
    // CREATE CARDS
    // =========================================


    filteredOutfits.forEach(
        outfit => {

            const card =
                createOutfitCard(
                    outfit
                );


            outfitsGrid.appendChild(
                card
            );

        }
    );

}



// ============================================
// CREATE OUTFIT CARD
// ============================================



function createOutfitCard(
    outfit
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "outfit-card";


    const outfitId =
        outfit.outfit_id ||
        outfit.outfitId;


    card.dataset.outfitId =
        outfitId;



    // =========================================
    // CARD CLICK
    // =========================================


    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".favourite-button"
                )
            ) {

                return;

            }


            window.location.href =
                `../outfit_details/outfit_details.html?outfit_id=${outfitId}`;

        }
    );



    // =========================================
    // ITEMS
    // =========================================


    const items =
        Array.isArray(
            outfit.items
        )
            ? outfit.items
            : [];



    // =========================================
    // CARD IMAGE
    // =========================================


    const imageArea =
        createOutfitImageArea(
            items
        );



    // =========================================
    // FAVOURITE BUTTON
    // =========================================


    const favouriteButton =
        document.createElement(
            "button"
        );


    favouriteButton.className =
        "favourite-button";


    if (
        outfit.favourite
    ) {

        favouriteButton.classList.add(
            "favourited"
        );

    }


    favouriteButton.innerHTML = `

        <span class="material-symbols-outlined">
            favorite
        </span>

    `;


    favouriteButton.title =
        outfit.favourite
            ? "Remove from favourites"
            : "Add to favourites";


    favouriteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            toggleFavourite(
                outfitId,
                favouriteButton
            );

        }
    );


    imageArea.appendChild(
        favouriteButton
    );



    // =========================================
    // INFO
    // =========================================


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "outfit-card-info";



    // =========================================
    // NAME
    // =========================================


    const name =
        document.createElement(
            "h3"
        );


    name.textContent =
        outfit.outfit_name ||
        "Untitled Outfit";


    info.appendChild(
        name
    );



    // =========================================
    // META
    // =========================================


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "outfit-meta";


    const occasion =
        outfit.occasion ||
        "Everyday";


    meta.innerHTML = `

        <span>
            ${escapeHtml(
                occasion
            )}
        </span>

        <span class="meta-dot">
            •
        </span>

        <span>
            ${getSeasonText(items)}
        </span>

    `;


    info.appendChild(
        meta
    );



    // =========================================
    // ITEM TAGS
    // =========================================


    if (
        items.length > 0
    ) {

        const tags =
            document.createElement(
                "div"
            );


        tags.className =
            "outfit-tags";


        items.forEach(
            item => {

                const tag =
                    document.createElement(
                        "span"
                    );


                tag.className =
                    "outfit-tag";


                tag.textContent =
                    item.name ||
                    "Clothing";


                tags.appendChild(
                    tag
                );

            }
        );


        info.appendChild(
            tags
        );

    }



    // =========================================
    // APPEND
    // =========================================


    card.appendChild(
        imageArea
    );


    card.appendChild(
        info
    );


    return card;

}



// ============================================
// CREATE IMAGE AREA
// ============================================



function createOutfitImageArea(
    items
) {

    const container =
        document.createElement(
            "div"
        );


    container.className =
        "outfit-images";



    // =========================================
    // NO ITEMS
    // =========================================


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="outfit-placeholder">

                <span class="material-symbols-outlined">
                    checkroom
                </span>

            </div>

        `;


        return container;

    }



    // =========================================
    // CHECK SAVED POSITIONS
    // =========================================


    const hasSavedPositions =
        items.some(
            item =>
                Number(item.position_x) !== 0 ||
                Number(item.position_y) !== 0
        );



    // =========================================
    // SAVED COMPOSITION
    // =========================================


    if (
        hasSavedPositions
    ) {

        container.classList.add(
            "saved-composition"
        );


        renderSavedComposition(
            container,
            items
        );


        return container;

    }



    // =========================================
    // OLD OUTFIT FALLBACK
    // =========================================


    renderOldCollage(
        container,
        items
    );


    return container;

}



// ============================================
// RENDER SAVED COMPOSITION
// ============================================



function renderSavedComposition(container, items) {
    const canvasWidth = 500;
    const canvasHeight = 700;

    const itemWidth = 150;
    const itemHeight = 185;

    // Keep only items that have images.
    const visibleItems = items
        .filter(item => item.image)
        .map(item => ({
            item,
            x: Number(item.position_x) || 0,
            y: Number(item.position_y) || 0,
            z: Number(item.z_index) || 1
        }));

    if (visibleItems.length === 0) return;

    // Find the complete bounds of the composition.
    const minX = Math.min(...visibleItems.map(entry => entry.x));
    const minY = Math.min(...visibleItems.map(entry => entry.y));

    const maxX = Math.max(
        ...visibleItems.map(entry => entry.x + itemWidth)
    );

    const maxY = Math.max(
        ...visibleItems.map(entry => entry.y + itemHeight)
    );

    const compositionWidth = maxX - minX;
    const compositionHeight = maxY - minY;

    // Leave a little breathing room around the clothes.
    const padding = 5;
    const availableWidth = 100 - padding * 2;
    const availableHeight = 100 - padding * 2;

    // Fit the complete composition inside the preview.
    const scale = Math.min(
        availableWidth / compositionWidth,
        availableHeight / compositionHeight
    );

    // Center the scaled composition.
    const scaledWidth = compositionWidth * scale;
    const scaledHeight = compositionHeight * scale;

    const offsetX = (100 - scaledWidth) / 2;
    const offsetY = (100 - scaledHeight) / 2;

    visibleItems.forEach(({ item, x, y, z }) => {
        const element = document.createElement("div");
        element.className = "saved-composition-item";

        element.style.left =
            `${offsetX + (x - minX) * scale}%`;

        element.style.top =
            `${offsetY + (y - minY) * scale}%`;

        element.style.width =
            `${itemWidth * scale}%`;

        element.style.height =
            `${itemHeight * scale}%`;

        element.style.zIndex = z;

        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.name || "Clothing item";

        element.appendChild(img);
        container.appendChild(element);
    });
}



// ============================================
// OLD COLLAGE FALLBACK
// ============================================



function renderOldCollage(
    container,
    items
) {


    // =========================================
    // ONE ITEM
    // =========================================


    if (
        items.length === 1
    ) {

        const img =
            createImage(
                items[0]
            );


        img.className =
            "single-outfit-image";


        container.appendChild(
            img
        );


        return;

    }



    // =========================================
    // TWO ITEMS
    // =========================================


    if (
        items.length === 2
    ) {

        const first =
            createImage(
                items[0]
            );


        first.className =
            "old-collage-main";


        const second =
            createImage(
                items[1]
            );


        second.className =
            "old-collage-small";


        container.appendChild(
            first
        );


        container.appendChild(
            second
        );


        return;

    }



    // =========================================
    // THREE OR MORE
    // =========================================


    items.forEach(
        (item, index) => {

            const img =
                createImage(
                    item
                );


            if (
                index === 0
            ) {

                img.className =
                    "old-collage-main";

            } else {

                img.className =
                    "old-collage-small";

            }


            container.appendChild(
                img
            );

        }
    );

}



// ============================================
// CREATE IMAGE
// ============================================



function createImage(
    item
) {

    const img =
        document.createElement(
            "img"
        );


    if (
        item.image
    ) {

        img.src =
            item.image;

    }


    img.alt =
        item.name ||
        "Clothing item";


    return img;

}



// ============================================
// SEASON TEXT
// ============================================



function getSeasonText(
    items
) {

    const seasons =
        [
            ...new Set(
                items
                    .map(
                        item =>
                            item.season
                    )
                    .filter(Boolean)
            )
        ];


    if (
        seasons.length === 0
    ) {

        return "All-season";

    }


    if (
        seasons.length === 1
    ) {

        return seasons[0];

    }


    return "Multiple seasons";

}



// ============================================
// TOGGLE FAVOURITE
// ============================================



async function toggleFavourite(
    outfitId,
    button
) {

    try {

        const response =
            await fetch(
                `http://localhost:5000/api/outfits/${outfitId}/favourite`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not update favourite."
            );

        }


        const updatedOutfit =
            data.outfit;



        // =====================================
        // UPDATE LOCAL DATA
        // =====================================


        const index =
            outfits.findIndex(
                outfit =>
                    Number(
                        outfit.outfit_id ||
                        outfit.outfitId
                    ) === Number(outfitId)
            );


        if (
            index !== -1
        ) {

            outfits[index].favourite =
                updatedOutfit.favourite;

        }



        // =====================================
        // UPDATE BUTTON
        // =====================================


        if (
            updatedOutfit.favourite
        ) {

            button.classList.add(
                "favourited"
            );


            button.title =
                "Remove from favourites";


        } else {

            button.classList.remove(
                "favourited"
            );


            button.title =
                "Add to favourites";

        }


    } catch (error) {

        console.error(
            "Favourite error:",
            error
        );


        alert(
            error.message ||
            "Could not update favourite."
        );

    }

}



// ============================================
// SEARCH
// ============================================



if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        event => {

            searchText =
                event.target.value
                    .trim()
                    .toLowerCase();


            renderOutfits();

        }
    );

}



// ============================================
// FILTER BUTTONS
// ============================================



document
    .querySelectorAll(
        "[data-filter]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {


                    // Remove active
                    // from all buttons


                    document
                        .querySelectorAll(
                            "[data-filter]"
                        )
                        .forEach(
                            btn => {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );



                    // Add active
                    // to clicked button


                    button.classList.add(
                        "active"
                    );



                    // Save selected filter


                    activeFilter =
                        button.dataset.filter;



                    // Re-render


                    renderOutfits();

                }
            );

        }
    );



// ============================================
// CREATE OUTFIT BUTTON
// ============================================



const createOutfitButton =
    document.getElementById(
        "createOutfitButton"
    );


if (
    createOutfitButton
) {

    createOutfitButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../create_outfit/create_outfit.html";

        }
    );

}



// ============================================
// EMPTY STATE CREATE BUTTON
// ============================================



const emptyCreateButton =
    document.getElementById(
        "emptyCreateButton"
    );


if (
    emptyCreateButton
) {

    emptyCreateButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../create_outfit/create_outfit.html";

        }
    );

}



// ============================================
// TOP SEARCH
// ============================================



const topSearchButton =
    document.getElementById(
        "topSearchButton"
    );


if (
    topSearchButton
) {

    topSearchButton.addEventListener(
        "click",
        () => {

            if (
                searchInput
            ) {

                searchInput.focus();

            }

        }
    );

}



// ============================================
// NOTIFICATIONS
// ============================================



const notificationButton =
    document.getElementById(
        "notificationButton"
    );


if (
    notificationButton
) {

    notificationButton.addEventListener(
        "click",
        () => {

            alert(
                "No new notifications."
            );

        }
    );

}



// ============================================
// PROFILE
// ============================================



const profileSection =
    document.getElementById(
        "profileSection"
    );


if (
    profileSection
) {

    profileSection.addEventListener(
        "click",
        () => {

            window.location.href =
                "../profile/profile.html";

        }
    );

}



// ============================================
// SIDEBAR NAVIGATION
// ============================================



const navigation = {

    dashboardLink:
        "../dashboard/dashboard.html",

    wardrobeLink:
        "../wardrobe/wardrobe.html",

    calendarLink:
        "../calendar/calendar.html",

    wearHistoryLink:
        "../wear_history/wear_history.html",

    analyticsLink:
        "../analytics/analytics.html",

    aiAssistantLink:
        "../ai_assistant/ai_assistant.html",

    preferencesLink:
        "../preferences/preferences.html"

};



Object.entries(
    navigation
)
.forEach(
    ([id, path]) => {

        const link =
            document.getElementById(
                id
            );


        if (!link) {

            return;

        }


        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                window.location.href =
                    path;

            }
        );

    }
);



// ============================================
// HTML ESCAPE
// ============================================



function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}



// ============================================
// INITIALIZE
// ============================================



loadUser();

loadOutfits();