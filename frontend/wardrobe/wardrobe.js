// wardrobe.js


const API_BASE =
    "http://localhost:5000";


document.addEventListener(
    "DOMContentLoaded",
    async function () {


        // =====================================================
        // LOGIN INFORMATION
        // =====================================================

        const token =
            localStorage.getItem(
                "token"
            );


        // =====================================================
        // PAGE ELEMENTS
        // =====================================================

        const displayName =
            document.getElementById(
                "displayName"
            );


        const wardrobeGrid =
            document.getElementById(
                "wardrobeGrid"
            );


        const emptyState =
            document.getElementById(
                "emptyState"
            );


        const loadingState =
            document.getElementById(
                "loadingState"
            );


        const errorState =
            document.getElementById(
                "errorState"
            );


        const itemCount =
            document.getElementById(
                "itemCount"
            );


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const categoryFilter =
            document.getElementById(
                "categoryFilter"
            );


        const colourFilter =
            document.getElementById(
                "colourFilter"
            );


        const seasonFilter =
            document.getElementById(
                "seasonFilter"
            );


        const addClothingBtn =
            document.getElementById(
                "addClothingBtn"
            );


        const emptyAddButton =
            document.getElementById(
                "emptyAddButton"
            );


        const profileButton =
            document.getElementById(
                "profileButton"
            );


        const searchButton =
            document.getElementById(
                "searchButton"
            );


        const notificationButton =
            document.getElementById(
                "notificationButton"
            );


        const aiAssistantLink =
            document.getElementById(
                "aiAssistantLink"
            );


        // =====================================================
        // CLOTHING DATA
        // =====================================================

        let clothingItems = [];


        // =====================================================
        // CHECK LOGIN
        // =====================================================

        if (!token) {

            alert(
                "Please login again."
            );


            window.location.href =
                "../login/login.html";


            return;

        }


        // =====================================================
        // INITIALIZE
        // =====================================================

        setupNavigation();

        await loadProfile();

        await loadWardrobe();


        // =====================================================
        // LOAD PROFILE
        // =====================================================

        async function loadProfile() {

            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/profile`,
                        {

                            method: "GET",

                            headers: {

                                "Authorization":
                                    "Bearer " + token

                            }

                        }
                    );


                // ---------------------------------------------
                // SESSION EXPIRED
                // ---------------------------------------------

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    handleSessionExpired();

                    return;

                }


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Unable to load profile."
                    );

                }


                const user =
                    data.user || data;


                const name =
                    user.name ||
                    user.username ||
                    "User";


                if (displayName) {

                    displayName.textContent =
                        name;

                }


                // Keep localStorage updated as well

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );


            } catch (error) {

                console.error(
                    "Profile loading error:",
                    error
                );


                // Fallback to localStorage

                const storedUser =
                    localStorage.getItem(
                        "user"
                    );


                if (!storedUser) {

                    return;

                }


                try {

                    const user =
                        JSON.parse(
                            storedUser
                        );


                    const name =
                        user.name ||
                        user.username ||
                        "User";


                    if (displayName) {

                        displayName.textContent =
                            name;

                    }

                } catch (storageError) {

                    console.error(
                        "Unable to read stored user:",
                        storageError
                    );

                }

            }

        }


        // =====================================================
        // LOAD WARDROBE
        // =====================================================

        async function loadWardrobe() {

            showLoading();


            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/clothing`,
                        {

                            method: "GET",

                            headers: {

                                "Authorization":
                                    "Bearer " + token

                            }

                        }
                    );


                const data =
                    await response.json();


                // ---------------------------------------------
                // LOGIN / TOKEN ERROR
                // ---------------------------------------------

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    handleSessionExpired();

                    return;

                }


                // ---------------------------------------------
                // BACKEND ERROR
                // ---------------------------------------------

                if (!response.ok) {

                    console.error(
                        data.error ||
                        "Unable to load wardrobe."
                    );


                    showError();

                    return;

                }


                // ---------------------------------------------
                // STORE CLOTHING ITEMS
                // ---------------------------------------------

                clothingItems =
                    Array.isArray(
                        data.items
                    )
                        ? data.items
                        : [];


                // ---------------------------------------------
                // DISPLAY CLOTHING
                // ---------------------------------------------

                displayWardrobe(
                    clothingItems
                );


            } catch (error) {

                console.error(
                    "Error loading wardrobe:",
                    error
                );


                showError();

            }

        }


        // =====================================================
        // DISPLAY WARDROBE
        // =====================================================

        function displayWardrobe(
            items
        ) {

            if (!wardrobeGrid) {

                return;

            }


            wardrobeGrid.innerHTML =
                "";


            // ---------------------------------------------
            // NO ITEMS
            // ---------------------------------------------

            if (
                !items ||
                items.length === 0
            ) {

                wardrobeGrid.style.display =
                    "none";


                if (emptyState) {

                    emptyState.style.display =
                        "flex";

                }


                if (itemCount) {

                    itemCount.textContent =
                        "0 items";

                }


                hideLoading();

                return;

            }


            // ---------------------------------------------
            // ITEMS EXIST
            // ---------------------------------------------

            wardrobeGrid.style.display =
                "grid";


            if (emptyState) {

                emptyState.style.display =
                    "none";

            }


            // ---------------------------------------------
            // ITEM COUNT
            // ---------------------------------------------

            if (itemCount) {

                itemCount.textContent =
                    items.length === 1
                        ? "1 item"
                        : `${items.length} items`;

            }


            // ---------------------------------------------
            // CREATE CARDS
            // ---------------------------------------------

            items.forEach(
                function (item) {

                    createClothingCard(
                        item
                    );

                }
            );


            hideLoading();

        }


        // =====================================================
        // CREATE CLOTHING CARD
        // =====================================================

        function createClothingCard(
            item
        ) {


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "clothing-card";


            // ---------------------------------------------
            // CARD CLICK
            // ---------------------------------------------

            card.addEventListener(
                "click",
                function () {

                    window.location.href =
                        `../clothing_details/clothing_details.html?item_id=${item.item_id}`;

                }
            );


            // ---------------------------------------------
            // IMAGE
            // ---------------------------------------------

            const imageContainer =
                document.createElement(
                    "div"
                );


            imageContainer.className =
                "clothing-image-container";


            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "clothing-image";


            image.alt =
                item.name ||
                "Clothing item";


            image.src =
                item.image ||
                "https://via.placeholder.com/500x600?text=No+Image";


            // ---------------------------------------------
            // IMAGE ERROR FALLBACK
            // ---------------------------------------------

            image.addEventListener(
                "error",
                function () {

                    image.src =
                        "https://via.placeholder.com/500x600?text=No+Image";

                }
            );


            imageContainer.appendChild(
                image
            );


            // ---------------------------------------------
            // CARD INFO
            // ---------------------------------------------

            const cardInfo =
                document.createElement(
                    "div"
                );


            cardInfo.className =
                "clothing-card-info";


            // ---------------------------------------------
            // NAME
            // ---------------------------------------------

            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                item.name ||
                "Unnamed Item";


            // ---------------------------------------------
            // CATEGORY
            // ---------------------------------------------

            const category =
                document.createElement(
                    "p"
                );


            category.className =
                "clothing-category";


            category.textContent =
                formatText(
                    item.category
                );


            // ---------------------------------------------
            // META
            // ---------------------------------------------

            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "clothing-meta";


            const colour =
                document.createElement(
                    "span"
                );


            colour.textContent =
                formatText(
                    item.colour
                );


            meta.appendChild(
                colour
            );


            // ---------------------------------------------
            // SEASON
            // ---------------------------------------------

            if (item.season) {

                const season =
                    document.createElement(
                        "span"
                    );


                season.textContent =
                    formatText(
                        item.season
                    );


                meta.appendChild(
                    season
                );

            }


            // ---------------------------------------------
            // BUILD CARD
            // ---------------------------------------------

            cardInfo.appendChild(
                name
            );


            cardInfo.appendChild(
                category
            );


            cardInfo.appendChild(
                meta
            );


            card.appendChild(
                imageContainer
            );


            card.appendChild(
                cardInfo
            );


            wardrobeGrid.appendChild(
                card
            );

        }


        // =====================================================
        // SEARCH + FILTER
        // =====================================================

        function applyFilters() {


            const searchValue =
                searchInput
                    ? searchInput.value
                        .toLowerCase()
                        .trim()
                    : "";


            const categoryValue =
                categoryFilter
                    ? categoryFilter.value
                        .toLowerCase()
                    : "all";


            const colourValue =
                colourFilter
                    ? colourFilter.value
                        .toLowerCase()
                    : "all";


            const seasonValue =
                seasonFilter
                    ? seasonFilter.value
                        .toLowerCase()
                    : "all";


            const filteredItems =
                clothingItems.filter(
                    function (item) {


                        // -----------------------------------------
                        // SEARCH
                        // -----------------------------------------

                        const name =
                            String(
                                item.name ||
                                ""
                            ).toLowerCase();


                        const category =
                            String(
                                item.category ||
                                ""
                            ).toLowerCase();


                        const colour =
                            String(
                                item.colour ||
                                ""
                            ).toLowerCase();


                        const occasion =
                            String(
                                item.occasion ||
                                ""
                            ).toLowerCase();


                        const season =
                            String(
                                item.season ||
                                ""
                            ).toLowerCase();


                        const matchesSearch =
                            !searchValue ||
                            name.includes(
                                searchValue
                            ) ||
                            category.includes(
                                searchValue
                            ) ||
                            colour.includes(
                                searchValue
                            ) ||
                            season.includes(
                                searchValue
                            ) ||
                            occasion.includes(
                                searchValue
                            );


                        // -----------------------------------------
                        // CATEGORY
                        // -----------------------------------------

                        const matchesCategory =
                            categoryValue === "all" ||
                            category ===
                                categoryValue;


                        // -----------------------------------------
                        // COLOUR
                        // -----------------------------------------

                        const matchesColour =
                            colourValue === "all" ||
                            colour ===
                                colourValue;


                        // -----------------------------------------
                        // SEASON
                        // -----------------------------------------

                        const matchesSeason =
                            seasonValue === "all" ||
                            season ===
                                seasonValue;


                        return (
                            matchesSearch &&
                            matchesCategory &&
                            matchesColour &&
                            matchesSeason
                        );

                    }
                );


            displayWardrobe(
                filteredItems
            );

        }


        // =====================================================
        // SEARCH
        // =====================================================

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                applyFilters
            );

        }


        // =====================================================
        // CATEGORY FILTER
        // =====================================================

        if (categoryFilter) {

            categoryFilter.addEventListener(
                "change",
                applyFilters
            );

        }


        // =====================================================
        // COLOUR FILTER
        // =====================================================

        if (colourFilter) {

            colourFilter.addEventListener(
                "change",
                applyFilters
            );

        }


        // =====================================================
        // SEASON FILTER
        // =====================================================

        if (seasonFilter) {

            seasonFilter.addEventListener(
                "change",
                applyFilters
            );

        }


        // =====================================================
        // ADD CLOTHING
        // =====================================================

        function openAddClothing() {

            window.location.href =
                "../add_clothing/add_clothing.html";

        }


        if (addClothingBtn) {

            addClothingBtn.addEventListener(
                "click",
                openAddClothing
            );

        }


        if (emptyAddButton) {

            emptyAddButton.addEventListener(
                "click",
                openAddClothing
            );

        }


        // =====================================================
        // NAVIGATION
        // =====================================================

        function setupNavigation() {


            // ---------------------------------------------
            // PROFILE AREA
            // ---------------------------------------------

            if (profileButton) {

                profileButton.style.cursor =
                    "pointer";


                profileButton.addEventListener(
                    "click",
                    function (event) {


                        // Don't open profile when
                        // clicking search/notification.

                        if (
                            event.target.closest(
                                ".top-icon"
                            )
                        ) {

                            return;

                        }


                        window.location.href =
                            "../profile/profile.html";

                    }
                );

            }


            // ---------------------------------------------
            // SEARCH ICON
            // ---------------------------------------------

            if (searchButton) {

                searchButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        if (searchInput) {

                            searchInput.focus();

                        }

                    }
                );

            }


            // ---------------------------------------------
            // NOTIFICATIONS
            // ---------------------------------------------

            if (notificationButton) {

                notificationButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        alert(
                            "No new notifications."
                        );

                    }
                );

            }


            

        }


        // =====================================================
        // LOADING STATE
        // =====================================================

        function showLoading() {


            if (loadingState) {

                loadingState.style.display =
                    "block";

            }


            if (errorState) {

                errorState.style.display =
                    "none";

            }


            if (emptyState) {

                emptyState.style.display =
                    "none";

            }


            if (wardrobeGrid) {

                wardrobeGrid.style.display =
                    "none";

            }

        }


        // =====================================================
        // HIDE LOADING
        // =====================================================

        function hideLoading() {


            if (loadingState) {

                loadingState.style.display =
                    "none";

            }

        }


        // =====================================================
        // ERROR STATE
        // =====================================================

        function showError() {


            if (loadingState) {

                loadingState.style.display =
                    "none";

            }


            if (wardrobeGrid) {

                wardrobeGrid.style.display =
                    "none";

            }


            if (emptyState) {

                emptyState.style.display =
                    "none";

            }


            if (errorState) {

                errorState.style.display =
                    "block";

            }

        }


        // =====================================================
        // SESSION EXPIRED
        // =====================================================

        function handleSessionExpired() {


            alert(
                "Your session has expired. Please login again."
            );


            localStorage.removeItem(
                "token"
            );


            localStorage.removeItem(
                "user"
            );


            window.location.href =
                "../login/login.html";

        }


        // =====================================================
        // FORMAT TEXT
        // =====================================================

        function formatText(
            value
        ) {


            if (!value) {

                return "";

            }


            return String(value)

                .replace(
                    /-/g,
                    " "
                )

                .replace(
                    /_/g,
                    " "
                )

                .replace(
                    /\b\w/g,
                    function (letter) {

                        return letter.toUpperCase();

                    }
                );

        }

    }
);