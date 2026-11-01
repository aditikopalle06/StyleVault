document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // LOGIN INFORMATION
    // ========================================

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");


    // ========================================
    // ELEMENTS
    // ========================================

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const detailsContainer =
        document.getElementById("detailsContainer");

    const displayName =
        document.getElementById("displayName");

    const outfitName =
        document.getElementById("outfitName");

    const outfitTags =
        document.getElementById("outfitTags");

    const infoOccasion =
        document.getElementById("infoOccasion");

    const infoItemCount =
        document.getElementById("infoItemCount");

    const infoCreated =
        document.getElementById("infoCreated");

    const infoFavourite =
        document.getElementById("infoFavourite");

    const outfitCanvas =
        document.getElementById("outfitCanvas");

    const itemsList =
        document.getElementById("itemsList");

    const favouriteButton =
        document.getElementById("favouriteButton");

    const favouriteIcon =
        document.getElementById("favouriteIcon");


    // ========================================
    // CURRENT OUTFIT
    // ========================================

    let currentOutfit = null;
    let currentItems = [];


    // ========================================
    // DISPLAY USER
    // ========================================

    if (storedUser) {

        try {

            const user = JSON.parse(storedUser);

            const name =
                user.name ||
                user.username ||
                "User";

            if (displayName) {
                displayName.textContent = name;
            }

        } catch (error) {

            console.error(
                "Unable to read user information:",
                error
            );

        }

    }


    // ========================================
    // CHECK TOKEN
    // ========================================

    if (!token) {

        alert("Please login again.");

        window.location.href =
            "../login/login.html";

        return;

    }


    // ========================================
    // GET OUTFIT ID
    // ========================================

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const outfitId =
        urlParams.get("outfit_id");


    if (!outfitId) {

        showError();

        console.error(
            "No outfit ID found in URL."
        );

        return;

    }


    // ========================================
    // LOAD OUTFIT
    // ========================================

    async function loadOutfit() {

        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/outfits/${outfitId}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                "Bearer " + token,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            const data =
                await response.json();


            // ========================================
            // TOKEN EXPIRED
            // ========================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                alert(
                    "Your session has expired. Please login again."
                );

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                window.location.href =
                    "../login/login.html";

                return;

            }


            // ========================================
            // OTHER ERROR
            // ========================================

            if (!response.ok) {

                console.error(
                    data.error ||
                    "Unable to load outfit."
                );

                showError();

                return;

            }


            // ========================================
            // GET OUTFIT DATA
            // ========================================

            currentOutfit =
                data.outfit || data;

            currentItems =
                data.items ||
                currentOutfit.items ||
                [];


            if (!currentOutfit) {

                showError();

                return;

            }


            displayOutfit();


        } catch (error) {

            console.error(
                "Error loading outfit:",
                error
            );

            showError();

        }

    }


    // ========================================
    // DISPLAY OUTFIT
    // ========================================

    function displayOutfit() {

        outfitName.textContent =
            currentOutfit.outfit_name ||
            "Unnamed Outfit";


        const occasion =
            formatText(
                currentOutfit.occasion
            );


        infoOccasion.textContent =
            occasion ||
            "Not specified";


        infoItemCount.textContent =
            currentItems.length;


        infoCreated.textContent =
            formatDate(
                currentOutfit.created_at
            );


        updateFavourite();


        createTags(
            currentOutfit.occasion,
            currentItems.length
        );


        /*
         * IMPORTANT:
         *
         * The canvas was previously rendered while
         * detailsContainer was still hidden.
         *
         * That caused outfitCanvas.clientWidth and
         * outfitCanvas.clientHeight to become 0.
         *
         * We make the details section visible FIRST,
         * then render the outfit.
         */

        loadingState.style.display = "none";

        detailsContainer.style.display = "grid";


        // Now the canvas has a real width/height.
        renderOutfitCanvas();


        renderItemsList();

    }


    // ========================================
    // CREATE TAGS
    // ========================================

    function createTags(
        occasion,
        itemCount
    ) {

        outfitTags.innerHTML = "";


        if (occasion) {

            const occasionTag =
                document.createElement("div");

            occasionTag.className =
                "item-tag tag-occasion";


            occasionTag.innerHTML = `
                <span class="material-symbols-outlined">
                    event
                </span>

                ${escapeHtml(
                    formatText(occasion)
                )}
            `;


            outfitTags.appendChild(
                occasionTag
            );

        }


        const itemTag =
            document.createElement("div");

        itemTag.className =
            "item-tag tag-items";


        itemTag.innerHTML = `
            <span class="material-symbols-outlined">
                checkroom
            </span>

            ${itemCount}
            item${itemCount === 1 ? "" : "s"}
        `;


        outfitTags.appendChild(
            itemTag
        );

    }


    // ========================================
    // RENDER OUTFIT VISUAL
    // ========================================

    function renderOutfitCanvas() {

        outfitCanvas.innerHTML = "";


        if (!currentItems.length) {

            outfitCanvas.innerHTML = `
                <div class="empty-outfit">
                    No clothing items in this outfit.
                </div>
            `;

            return;

        }


        /*
         * Make sure the canvas itself is positioned
         * correctly before adding clothing pieces.
         */

        outfitCanvas.style.position = "relative";
        outfitCanvas.style.overflow = "hidden";


        /*
         * Check whether the outfit contains actual
         * saved positions.
         *
         * If every item has 0,0 then it is an older
         * outfit and we create a default composition.
         */

        const hasPositions =
            currentItems.some(
                item =>
                    Number(item.position_x) !== 0 ||
                    Number(item.position_y) !== 0
            );


        if (hasPositions) {

            renderPositionedItems();

        } else {

            renderFallbackItems();

        }

    }


    // ========================================
    // POSITIONED ITEMS
    // ========================================

    
function renderPositionedItems() {
    const originalWidth = 500;
    const originalHeight = 700;

    const canvasWidth = outfitCanvas.clientWidth;
    const canvasHeight = outfitCanvas.clientHeight;

    if (canvasWidth <= 0 || canvasHeight <= 0) {
        return;
    }

    // Keep only clothing items that have images.
    const visibleItems = currentItems
        .filter(item => item.image)
        .map(item => ({
            item,
            x: Number(item.position_x) || 0,
            y: Number(item.position_y) || 0,
            z: Number(item.z_index) || 1
        }));

    if (!visibleItems.length) return;

    const itemWidth = 150;
    const itemHeight = 185;
    const padding = 12;

    // Find the full area occupied by the outfit.
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

    // Scale the complete composition to fit the details canvas.
    const scale = Math.min(
        (canvasWidth - padding * 2) / compositionWidth,
        (canvasHeight - padding * 2) / compositionHeight
    );

    // Center the composition in the available space.
    const scaledWidth = compositionWidth * scale;
    const scaledHeight = compositionHeight * scale;

    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    visibleItems.forEach(({ item, x, y, z }) => {
        const element = document.createElement("div");

        element.className = "outfit-detail-item";

        element.style.position = "absolute";
        element.style.left =
            `${offsetX + (x - minX) * scale}px`;
        element.style.top =
            `${offsetY + (y - minY) * scale}px`;
        element.style.width = `${itemWidth * scale}px`;
        element.style.height = `${itemHeight * scale}px`;
        element.style.zIndex = String(z);
        element.style.overflow = "hidden";
        element.style.borderRadius = "8px";

        const image = document.createElement("img");

        image.src = item.image;
        image.alt = item.name || "Clothing item";

        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "contain";
        image.style.display = "block";

        element.appendChild(image);
        outfitCanvas.appendChild(element);
    });
}


    // ========================================
    // FALLBACK FOR OUTFITS WITH NO POSITIONS
    // ========================================

    function renderFallbackItems() {

        const count =
            currentItems.length;


        currentItems.forEach(
            function (item, index) {

                const itemElement =
                    document.createElement("div");


                itemElement.className =
                    "fallback-item";


                /*
                 * Explicit positioning.
                 */

                itemElement.style.position =
                    "absolute";

                itemElement.style.overflow =
                    "hidden";

                itemElement.style.borderRadius =
                    "8px";


                // ========================================
                // ONE ITEM
                // ========================================

                if (count === 1) {

                    itemElement.style.left =
                        "25%";

                    itemElement.style.top =
                        "8%";

                    itemElement.style.width =
                        "50%";

                    itemElement.style.height =
                        "84%";

                }


                // ========================================
                // TWO ITEMS
                // ========================================

                else if (count === 2) {

                    itemElement.style.width =
                        "46%";

                    itemElement.style.height =
                        "76%";

                    itemElement.style.top =
                        "12%";


                    if (index === 0) {

                        itemElement.style.left =
                            "3%";

                    } else {

                        itemElement.style.left =
                            "51%";

                    }

                }


                // ========================================
                // THREE OR MORE ITEMS
                // ========================================

                else {

                    const positions = [

                        {
                            left: "5%",
                            top: "8%",
                            width: "42%",
                            height: "44%"
                        },

                        {
                            left: "53%",
                            top: "8%",
                            width: "42%",
                            height: "44%"
                        },

                        {
                            left: "29%",
                            top: "53%",
                            width: "42%",
                            height: "40%"
                        }

                    ];


                    const position =
                        positions[
                            index %
                            positions.length
                        ];


                    itemElement.style.left =
                        position.left;

                    itemElement.style.top =
                        position.top;

                    itemElement.style.width =
                        position.width;

                    itemElement.style.height =
                        position.height;

                }


                // ========================================
                // IMAGE
                // ========================================

                const image =
                    document.createElement("img");


                image.src =
                    item.image ||
                    "";


                image.alt =
                    item.name ||
                    "Clothing item";


                image.style.width =
                    "100%";

                image.style.height =
                    "100%";

                image.style.objectFit =
                    "cover";

                image.style.display =
                    "block";


                /*
                 * Image fallback.
                 */

                image.addEventListener(
                    "error",
                    function () {

                        image.style.display =
                            "none";


                        const fallback =
                            document.createElement("div");


                        fallback.style.width =
                            "100%";

                        fallback.style.height =
                            "100%";

                        fallback.style.display =
                            "flex";

                        fallback.style.alignItems =
                            "center";

                        fallback.style.justifyContent =
                            "center";

                        fallback.style.background =
                            "#f3ede8";

                        fallback.style.color =
                            "#757871";


                        fallback.innerHTML = `
                            <span
                                class="material-symbols-outlined"
                                style="font-size:42px;"
                            >
                                checkroom
                            </span>
                        `;


                        itemElement.appendChild(
                            fallback
                        );

                    }
                );


                itemElement.appendChild(
                    image
                );


                outfitCanvas.appendChild(
                    itemElement
                );

            }
        );

    }


    // ========================================
    // RENDER ITEM LIST
    // ========================================

    function renderItemsList() {

        itemsList.innerHTML = "";


        currentItems.forEach(
            function (item) {

                const row =
                    document.createElement("div");


                row.className =
                    "clothing-row";


                row.innerHTML = `
                    <div class="clothing-row-image">

                        <img
                            src="${
                                item.image ||
                                "https://via.placeholder.com/100x100?text=No+Image"
                            }"
                            alt="${escapeHtml(
                                item.name ||
                                "Clothing item"
                            )}"
                        >

                    </div>


                    <div class="clothing-row-info">

                        <p class="clothing-row-name">
                            ${escapeHtml(
                                item.name ||
                                "Unnamed Item"
                            )}
                        </p>


                        <div class="clothing-row-category">
                            ${escapeHtml(
                                formatText(
                                    item.category
                                ) ||
                                "Clothing"
                            )}
                        </div>

                    </div>
                `;


                itemsList.appendChild(
                    row
                );

            }
        );

    }


    // ========================================
    // FAVOURITE UI
    // ========================================

    function updateFavourite() {

        const favourite =
            Boolean(
                currentOutfit.favourite
            );


        infoFavourite.textContent =
            favourite
                ? "Yes"
                : "No";


        if (favourite) {

            favouriteButton.classList.add(
                "active"
            );

            favouriteIcon.textContent =
                "favorite";

        } else {

            favouriteButton.classList.remove(
                "active"
            );

            favouriteIcon.textContent =
                "favorite_border";

        }

    }


    // ========================================
    // TOGGLE FAVOURITE
    // ========================================

    favouriteButton.addEventListener(
        "click",
        async function () {

            try {

                const response =
                    await fetch(
                        `http://localhost:5000/api/outfits/${outfitId}/favourite`,
                        {
                            method: "PATCH",

                            headers: {
                                "Authorization":
                                    "Bearer " + token,

                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.error ||
                        "Unable to update favourite."
                    );

                    return;

                }


                /*
                 * Backend returns the updated outfit.
                 *
                 * We support both:
                 * data.outfit.favourite
                 * and data.favourite
                 */

                if (
                    data.outfit &&
                    typeof data.outfit.favourite !==
                        "undefined"
                ) {

                    currentOutfit.favourite =
                        data.outfit.favourite;

                } else {

                    currentOutfit.favourite =
                        data.favourite;

                }


                updateFavourite();


            } catch (error) {

                console.error(
                    "Error updating favourite:",
                    error
                );

                alert(
                    "Something went wrong."
                );

            }

        }
    );


    // ========================================
    // DELETE OUTFIT
    // ========================================

    async function deleteOutfit() {

        const confirmed =
            confirm(
                "Are you sure you want to delete this outfit?"
            );


        if (!confirmed) {

            return;

        }


        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/outfits/${outfitId}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Authorization":
                                "Bearer " + token
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.error ||
                    "Unable to delete outfit."
                );

                return;

            }


            alert(
                "Outfit deleted successfully."
            );


            window.location.href =
                "../outfits/outfits.html";


        } catch (error) {

            console.error(
                "Error deleting outfit:",
                error
            );

            alert(
                "Something went wrong while deleting the outfit."
            );

        }

    }


    // ========================================
    // EDIT
    // ========================================

    function openEditPage() {

        window.location.href =
            `../create_outfit/create_outfit.html?outfit_id=${outfitId}`;

    }


    // ========================================
    // NAVIGATION
    // ========================================

    function goBack() {

        window.location.href =
            "../outfits/outfits.html";

    }


    const backButton =
        document.getElementById(
            "backButton"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            goBack
        );

    }


    const backButtonMobile =
        document.getElementById(
            "backButtonMobile"
        );

    if (backButtonMobile) {

        backButtonMobile.addEventListener(
            "click",
            goBack
        );

    }


    const backFromErrorButton =
        document.getElementById(
            "backFromErrorButton"
        );

    if (backFromErrorButton) {

        backFromErrorButton.addEventListener(
            "click",
            goBack
        );

    }


    const deleteButton =
        document.getElementById(
            "deleteButton"
        );

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            deleteOutfit
        );

    }


    const editButton =
        document.getElementById(
            "editButton"
        );

    if (editButton) {

        editButton.addEventListener(
            "click",
            openEditPage
        );

    }


    const editButtonMobile =
        document.getElementById(
            "editButtonMobile"
        );

    if (editButtonMobile) {

        editButtonMobile.addEventListener(
            "click",
            openEditPage
        );

    }


    const editBottomButton =
        document.getElementById(
            "editBottomButton"
        );

    if (editBottomButton) {

        editBottomButton.addEventListener(
            "click",
            openEditPage
        );

    }


    // ========================================
    // PROFILE
    // ========================================

    const profileButton =
        document.getElementById(
            "profileButton"
        );

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "../profile/profile.html";

            }
        );

    }


    // ========================================
    // HELPERS
    // ========================================

    function formatText(value) {

        if (!value) {

            return "";

        }


        return String(value)
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                function (letter) {

                    return letter.toUpperCase();

                }
            );

    }


    function formatDate(value) {

        if (!value) {

            return "Not specified";

        }


        const date =
            new Date(value);


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return "Not specified";

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }


    function escapeHtml(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    function showError() {

        loadingState.style.display =
            "none";


        detailsContainer.style.display =
            "none";


        errorState.style.display =
            "flex";

    }


    // ========================================
    // START
    // ========================================

    loadOutfit();

});