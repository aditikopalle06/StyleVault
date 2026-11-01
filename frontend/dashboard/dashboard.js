// dashboard.js

document.addEventListener("DOMContentLoaded", function () {

    const API_BASE = "http://localhost:5000";

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");


    // ============================================
    // ELEMENTS
    // ============================================

    const userNameElement =
        document.getElementById("userName");

    const displayNameElement =
        document.getElementById("displayName");

    const wardrobeCountElement =
        document.getElementById("wardrobeCount");

    const outfitCountElement =
        document.getElementById("outfitCount");

    const recentItemsElement =
        document.getElementById("recentItems");


    // ============================================
    // DATA
    // ============================================

    let clothingItems = [];
    let outfits = [];
    let calendarEvents = [];
    let wearHistory = [];


    // ============================================
    // DISPLAY LOGGED-IN USER
    // ============================================

    function displayUser() {

        if (!storedUser) {
            return;
        }

        try {

            const user = JSON.parse(storedUser);

            const name =
                user.name ||
                user.username ||
                "User";

            if (userNameElement) {
                userNameElement.textContent = name;
            }

            if (displayNameElement) {
                displayNameElement.textContent = name;
            }

        } catch (error) {

            console.error(
                "Unable to read user information:",
                error
            );

        }
    }


    displayUser();


    // ============================================
    // AUTH HEADERS
    // ============================================

    function getHeaders() {

        return {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        };

    }


    // ============================================
    // FETCH HELPER
    // ============================================

    async function fetchAPI(endpoint) {

        if (!token) {

            console.error(
                "No login token found."
            );

            return null;
        }


        try {

            const response =
                await fetch(
                    API_BASE + endpoint,
                    {
                        method: "GET",
                        headers: getHeaders()
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "API error:",
                    endpoint,
                    data.error || data.message
                );

                return null;
            }


            return data;

        } catch (error) {

            console.error(
                "Request failed:",
                endpoint,
                error
            );

            return null;
        }

    }


    // ============================================
    // LOAD ALL DASHBOARD DATA
    // ============================================

    async function loadDashboardData() {

        if (!token) {
            return;
        }


        const [
            clothingData,
            outfitData,
            calendarData,
            wearData
        ] = await Promise.all([

            fetchAPI("/api/clothing"),

            fetchAPI("/api/outfits"),

            fetchAPI("/api/calendar"),

            fetchAPI("/api/wear-history")

        ]);


        // ----------------------------
        // CLOTHING
        // ----------------------------

        if (clothingData) {

            clothingItems =
                clothingData.items ||
                clothingData.clothing ||
                [];

        }


        // ----------------------------
        // OUTFITS
        // ----------------------------

        if (outfitData) {

            outfits =
                outfitData.outfits ||
                outfitData.items ||
                [];

        }


        // ----------------------------
        // CALENDAR
        // ----------------------------

        if (calendarData) {

            calendarEvents =
                calendarData.events ||
                calendarData.items ||
                [];

        }


        // ----------------------------
        // WEAR HISTORY
        // ----------------------------

        if (wearData) {

            wearHistory =
                wearData.records ||
                wearData.history ||
                wearData.items ||
                [];

        }


        console.log(
            "Dashboard clothing:",
            clothingItems
        );

        console.log(
            "Dashboard outfits:",
            outfits
        );

        console.log(
            "Dashboard calendar:",
            calendarEvents
        );

        console.log(
            "Dashboard wear history:",
            wearHistory
        );


        // ========================================
        // RENDER EVERYTHING
        // ========================================

        renderWardrobeCount();

        renderOutfitCount();

        renderRecentItems();

        renderCategoryBreakdown();

        renderTodayOutfit();

        renderUpcomingOutfit();

        renderWardrobeInsight();

    }


    // ============================================
    // WARDROBE COUNT
    // ============================================

    function renderWardrobeCount() {

        if (!wardrobeCountElement) {
            return;
        }

        wardrobeCountElement.textContent =
            clothingItems.length;

    }


    // ============================================
    // OUTFIT COUNT
    // ============================================

    function renderOutfitCount() {

        if (!outfitCountElement) {
            return;
        }

        outfitCountElement.textContent =
            outfits.length;

    }


    // ============================================
    // RECENTLY ADDED ITEMS
    // ============================================

    function renderRecentItems() {

        if (!recentItemsElement) {
            return;
        }


        if (clothingItems.length === 0) {

            recentItemsElement.innerHTML = `

                <div class="empty-wardrobe">

                    <span class="material-symbols-outlined">
                        checkroom
                    </span>

                    <p>
                        Your wardrobe is empty.
                    </p>

                    <span>
                        Add your first clothing item
                        to see it here.
                    </span>

                </div>

            `;

            return;
        }


        /*
         * The backend does not necessarily guarantee
         * chronological ordering, so use the last
         * two records as the existing Dashboard did.
         */

        const recentItems =
            clothingItems
                .slice(-2)
                .reverse();


        recentItemsElement.innerHTML = "";


        recentItems.forEach(function (item) {

            const itemElement =
                document.createElement("div");

            itemElement.className =
                "recent-item";


            const image =
                item.image ||
                "https://via.placeholder.com/300x300?text=No+Image";


            itemElement.innerHTML = `

                <img
                    src="${image}"
                    alt="${item.name || "Clothing item"}"
                >

                <p>
                    ${item.name || "Unnamed item"}
                </p>

            `;


            recentItemsElement.appendChild(
                itemElement
            );

        });

    }


    // ============================================
    // CATEGORY BREAKDOWN
    // ============================================

    function renderCategoryBreakdown() {

        const categoryContainer =
            document.querySelector(
                ".category-card"
            );


        if (!categoryContainer) {
            return;
        }


        if (clothingItems.length === 0) {

            categoryContainer.innerHTML = `

                <p class="small-title">
                    CATEGORY BREAKDOWN
                </p>

                <div class="category-empty-state">

                    <span class="material-symbols-outlined">
                        pie_chart
                    </span>

                    <p>
                        No wardrobe data yet.
                    </p>

                    <span>
                        Add clothing items to see
                        your category breakdown.
                    </span>

                </div>

            `;

            return;
        }


        const categories = {};


        clothingItems.forEach(function (item) {

            const category =
                item.category ||
                "Other";


            categories[category] =
                (categories[category] || 0) + 1;

        });


        const sortedCategories =
            Object.entries(categories)
                .sort(function (a, b) {
                    return b[1] - a[1];
                });


        let categoryHTML = `

            <p class="small-title">
                CATEGORY BREAKDOWN
            </p>

            <div class="dashboard-category-list">

        `;


        sortedCategories.forEach(
            function ([category, count]) {

                const percentage =
                    Math.round(
                        (count / clothingItems.length) * 100
                    );


                categoryHTML += `

                    <div class="dashboard-category-row">

                        <div class="dashboard-category-name">

                            <span>
                                ${category}
                            </span>

                            <span>
                                ${count}
                            </span>

                        </div>

                        <div class="dashboard-category-bar">

                            <div
                                class="dashboard-category-fill"
                                style="width:${percentage}%"
                            ></div>

                        </div>

                    </div>

                `;

            }
        );


        categoryHTML += `
            </div>
        `;


        categoryContainer.innerHTML =
            categoryHTML;

    }


    // ============================================
    // DATE HELPERS
    // ============================================

    function getTodayString() {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                today.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;

    }


    function normalizeDate(value) {

        if (!value) {
            return "";
        }


        /*
         * IMPORTANT:
         * Do not use new Date("YYYY-MM-DD")
         * because that can cause the previous-day
         * timezone problem.
         */

        return String(value)
            .slice(0, 10);

    }


    // ============================================
    // FIND OUTFIT FOR CALENDAR EVENT
    // ============================================

    function findOutfit(outfitId) {

        return outfits.find(
            function (outfit) {

                return String(
                    outfit.outfit_id ||
                    outfit.id
                ) === String(outfitId);

            }
        );

    }


    // ============================================
    // GET OUTFIT ITEMS
    // ============================================

    function getOutfitItems(outfit) {

        if (!outfit) {
            return [];
        }


        return (
            outfit.items ||
            outfit.clothing_items ||
            outfit.outfit_items ||
            []
        );

    }


    // ============================================
    // GET ITEM BY ID
    // ============================================

    function findClothingItem(itemId) {

        return clothingItems.find(
            function (item) {

                return String(
                    item.item_id ||
                    item.id
                ) === String(itemId);

            }
        );

    }


    // ============================================
    // GET OUTFIT IMAGE
    // ============================================

    function getOutfitImage(outfit) {

        const items =
            getOutfitItems(outfit);


        if (items.length === 0) {

            return null;

        }


        for (const item of items) {

            const clothingItem =
                item.image
                    ? item
                    : findClothingItem(
                        item.item_id ||
                        item.id
                    );


            if (
                clothingItem &&
                clothingItem.image
            ) {

                return clothingItem.image;

            }

        }


        return null;

    }


    // ============================================
    // TODAY'S OUTFIT
    // ============================================

    function renderTodayOutfit() {

        const outfitCard =
            document.querySelector(
                ".outfit-card"
            );


        if (!outfitCard) {
            return;
        }


        const today =
            getTodayString();


        const todayEvents =
            calendarEvents
                .filter(function (event) {

                    return normalizeDate(
                        event.event_date ||
                        event.date
                    ) === today;

                })
                .sort(function (a, b) {

                    return String(
                        a.event_time || ""
                    ).localeCompare(
                        String(
                            b.event_time || ""
                        )
                    );

                });


        const todayEvent =
            todayEvents[0];


        // ----------------------------------------
        // NO EVENT
        // ----------------------------------------

        if (!todayEvent) {

            outfitCard.innerHTML = `

                <div class="card-header">

                    <h2>

                        <span class="material-symbols-outlined">
                            wb_sunny
                        </span>

                        Today's Ensemble

                    </h2>

                    <span class="tag">
                        Planned Outfit
                    </span>

                </div>


                <div class="outfit-empty-state">

                    <span class="material-symbols-outlined">
                        styler
                    </span>

                    <h3>
                        No outfit planned for today
                    </h3>

                    <p>
                        Plan an outfit to see it
                        displayed here.
                    </p>

                    <button
                        class="primary-button"
                        id="planOutfitButton"
                    >
                        PLAN AN OUTFIT
                    </button>

                </div>

            `;


            const button =
                document.getElementById(
                    "planOutfitButton"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "../calendar/calendar.html";

                    }
                );

            }


            return;
        }


        // ----------------------------------------
        // EVENT FOUND
        // ----------------------------------------

        const outfit =
            findOutfit(
                todayEvent.outfit_id
            );


        const outfitName =
            outfit?.outfit_name ||
            todayEvent.event_name ||
            "Planned Outfit";


        const occasion =
            outfit?.occasion ||
            "";


        const image =
            getOutfitImage(outfit);


        const imageHTML =
            image
                ? `
                    <div class="outfit-image">

                        <img
                            src="${image}"
                            alt="${outfitName}"
                        >

                    </div>
                `
                : `
                    <div class="outfit-image">

                        <span class="material-symbols-outlined">
                            styler
                        </span>

                    </div>
                `;


        outfitCard.innerHTML = `

            <div class="card-header">

                <h2>

                    <span class="material-symbols-outlined">
                        wb_sunny
                    </span>

                    Today's Ensemble

                </h2>

                <span class="tag">
                    Planned Outfit
                </span>

            </div>


            <div class="outfit-content">

                ${imageHTML}


                <div class="outfit-details">

                    <div>

                        <p class="small-title">
                            TODAY'S LOOK
                        </p>

                        <h3>
                            ${outfitName}
                        </h3>

                        ${
                            occasion
                                ? `
                                    <p>
                                        ${occasion}
                                    </p>
                                  `
                                : ""
                        }

                    </div>


                    <button
                        class="primary-button"
                        id="viewTodayOutfitButton"
                    >
                        VIEW OUTFIT
                    </button>

                </div>

            </div>

        `;


        const viewButton =
            document.getElementById(
                "viewTodayOutfitButton"
            );


        if (
            viewButton &&
            outfit
        ) {

            const outfitId =
                outfit.outfit_id ||
                outfit.id;


            viewButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "../outfit_details/outfit_details.html?outfit_id=" +
                        outfitId;

                }
            );

        }

    }


    // ============================================
    // UPCOMING OUTFIT
    // ============================================

    function renderUpcomingOutfit() {

        const upcomingCard =
            document.querySelector(
                ".upcoming-card"
            );


        if (!upcomingCard) {
            return;
        }


        const today =
            getTodayString();


        const futureEvents =
            calendarEvents
                .filter(function (event) {

                    const date =
                        normalizeDate(
                            event.event_date ||
                            event.date
                        );

                    return date > today;

                })
                .sort(function (a, b) {

                    const dateA =
                        normalizeDate(
                            a.event_date ||
                            a.date
                        );

                    const dateB =
                        normalizeDate(
                            b.event_date ||
                            b.date
                        );


                    if (dateA !== dateB) {

                        return dateA.localeCompare(
                            dateB
                        );

                    }


                    return String(
                        a.event_time || ""
                    ).localeCompare(
                        String(
                            b.event_time || ""
                        )
                    );

                });


        const upcomingEvent =
            futureEvents[0];


        // ----------------------------------------
        // NO UPCOMING EVENT
        // ----------------------------------------

        if (!upcomingEvent) {

            upcomingCard.innerHTML = `

                <div class="upcoming-empty-state">

                    <span class="material-symbols-outlined">
                        calendar_month
                    </span>

                    <div>

                        <p class="small-title">
                            UPCOMING OUTFIT
                        </p>

                        <h3>
                            No upcoming outfits
                        </h3>

                        <p class="muted-text">
                            Your planned outfits
                            will appear here.
                        </p>

                    </div>

                </div>

            `;

            return;
        }


        // ----------------------------------------
        // UPCOMING EVENT FOUND
        // ----------------------------------------

        const outfit =
            findOutfit(
                upcomingEvent.outfit_id
            );


        const outfitName =
            outfit?.outfit_name ||
            upcomingEvent.event_name ||
            "Planned Outfit";


        const image =
            getOutfitImage(outfit);


        const eventDate =
            normalizeDate(
                upcomingEvent.event_date ||
                upcomingEvent.date
            );


        let displayDate =
            eventDate;


        if (eventDate) {

            const parts =
                eventDate.split("-");


            displayDate =
                `${parts[2]}/${parts[1]}/${parts[0]}`;

        }


        upcomingCard.innerHTML = `

            ${
                image
                    ? `
                        <div class="upcoming-image">

                            <img
                                src="${image}"
                                alt="${outfitName}"
                            >

                        </div>
                      `
                    : `
                        <div
                            class="upcoming-image"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:#f3ede8;
                            "
                        >

                            <span class="material-symbols-outlined">
                                styler
                            </span>

                        </div>
                      `
            }


            <div>

                <p class="small-title">
                    UPCOMING OUTFIT
                </p>

                <h3>
                    ${outfitName}
                </h3>

                <p class="muted-text">
                    ${displayDate}
                    ${
                        upcomingEvent.event_time
                            ? " · " +
                              upcomingEvent.event_time
                            : ""
                    }
                </p>

            </div>


            <span class="material-symbols-outlined arrow">
                chevron_right
            </span>

        `;


        upcomingCard.style.cursor =
            "pointer";


        upcomingCard.addEventListener(
            "click",
            function () {

                window.location.href =
                    "../calendar/calendar.html";

            }
        );

    }


    // ============================================
    // WARDROBE INSIGHT
    // ============================================

    function renderWardrobeInsight() {

        const insightText =
            document.querySelector(
                ".insight-text"
            );


        if (!insightText) {
            return;
        }


        if (clothingItems.length === 0) {

            insightText.textContent =
                "Start adding and wearing clothing items to see wardrobe insights.";

            return;

        }


        // ----------------------------------------
        // COUNT WEARS
        // ----------------------------------------

        const wearCounts = {};


        wearHistory.forEach(
            function (record) {

                const itemId =
                    record.item_id ||
                    record.clothing_id;


                if (!itemId) {
                    return;
                }


                wearCounts[itemId] =
                    (wearCounts[itemId] || 0) + 1;

            }
        );


        const entries =
            Object.entries(
                wearCounts
            );


        // ----------------------------------------
        // NO WEAR DATA
        // ----------------------------------------

        if (entries.length === 0) {

            insightText.innerHTML = `
                You have
                <strong>
                    ${clothingItems.length}
                </strong>
                items in your wardrobe.
                Start recording wears to see
                personalized insights.
            `;

            return;

        }


        // ----------------------------------------
        // MOST WORN
        // ----------------------------------------

        entries.sort(
            function (a, b) {
                return b[1] - a[1];
            }
        );


        const mostWornId =
            entries[0][0];


        const mostWorn =
            findClothingItem(
                mostWornId
            );


        const wearCount =
            entries[0][1];


        if (mostWorn) {

            insightText.innerHTML = `

                Your most worn item is
                <strong>
                    ${mostWorn.name}
                </strong>
                with
                <strong>
                    ${wearCount}
                </strong>
                wear${wearCount === 1 ? "" : "s"}.

            `;

            return;

        }


        insightText.textContent =
            "Your wardrobe insights will appear here as you add more wear history.";

    }


    // ============================================
    // SIDEBAR NAVIGATION
    // ============================================

    function setupNavigation() {

        const navigation = {

            dashboardLink:
                "../dashboard/dashboard.html",

            wardrobeLink:
                "../wardrobe/wardrobe.html",

            outfitsLink:
                "../outfits/outfits.html",

            calendarLink:
                "../calendar/calendar.html",

            wearHistoryLink:
                "../wear_history/wear_history.html",

            analyticsLink:
                "../analytics/analytics.html",

            preferencesLink:
                "../preferences/preferences.html",

            profileLink:
                "../profile/profile.html"

        };


        Object.keys(navigation)
            .forEach(function (id) {

                const element =
                    document.getElementById(id);


                if (!element) {
                    return;
                }


                element.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        window.location.href =
                            navigation[id];

                    }
                );

            });


        // ----------------------------------------
        // AI ASSISTANT
        // ----------------------------------------

        const aiLink =
            document.querySelector(
                ".ai-link"
            );


        

        


        // ----------------------------------------
        // PROFILE AREA
        // ----------------------------------------

        const dashboardProfile =
            document.getElementById(
                "dashboardProfile"
            );


        if (dashboardProfile) {

            dashboardProfile.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "../profile/profile.html";

                }
            );

        }


        // ----------------------------------------
        // VIEW WARDROBE
        // ----------------------------------------

        const viewWardrobe =
            document.querySelector(
                ".card-header a[href*='wardrobe']"
            );


        if (viewWardrobe) {

            viewWardrobe.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "../wardrobe/wardrobe.html";

                }
            );

        }

    }


    setupNavigation();


    // ============================================
    // LOAD DASHBOARD
    // ============================================

    loadDashboardData();

});