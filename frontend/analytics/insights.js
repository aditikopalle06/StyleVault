const API_BASE = "http://localhost:5000";

const token = localStorage.getItem("token");

let clothingItems = [];
let wearHistory = [];


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    if (!token) {
        window.location.href = "../login/login.html";
        return;
    }

    setupNavigation();

    await loadProfile();
    await loadData();

});


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const searchButton =
        document.getElementById("searchButton");

    if (searchButton) {
        searchButton.addEventListener("click", () => {
            window.location.href =
                "../wardrobe/wardrobe.html";
        });
    }


    const notificationButton =
        document.getElementById("notificationButton");

    if (notificationButton) {
        notificationButton.addEventListener("click", () => {
            alert("No new notifications.");
        });
    }


    const exportButton =
        document.getElementById("exportButton");

    if (exportButton) {
        exportButton.addEventListener(
            "click",
            exportReport
        );
    }

}


// =====================================================
// PROFILE
// =====================================================

async function loadProfile() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/profile`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) return;


        const data =
            await response.json();


        const user =
            data.user || data;


        const profileName =
            document.getElementById(
                "profileName"
            );


        if (profileName) {

            profileName.textContent =
                user.name ||
                user.username ||
                user.full_name ||
                "Fashion Muse";

        }


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

    }

}


// =====================================================
// LOAD DATA
// =====================================================

async function loadData() {

    try {

        const [
            clothingResponse,
            historyResponse
        ] = await Promise.all([

            fetch(
                `${API_BASE}/api/clothing`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            ),

            fetch(
                `${API_BASE}/api/wear-history`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            )

        ]);


        if (!clothingResponse.ok) {
            throw new Error(
                "Failed to load wardrobe."
            );
        }


        if (!historyResponse.ok) {
            throw new Error(
                "Failed to load wear history."
            );
        }


        const clothingData =
            await clothingResponse.json();


        const historyData =
            await historyResponse.json();


        clothingItems =
            Array.isArray(clothingData)
                ? clothingData
                : clothingData.items ||
                  clothingData.clothing ||
                  [];


        wearHistory =
            Array.isArray(historyData)
                ? historyData
                : historyData.wearHistory ||
                  historyData.history ||
                  historyData.items ||
                  [];


        console.log(
            "Analytics clothing items:",
            clothingItems
        );

        console.log(
            "Analytics wear history:",
            wearHistory
        );


        renderAllAnalytics();


    } catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );

        showError();

    }

}


// =====================================================
// RENDER ALL
// =====================================================

function renderAllAnalytics() {

    renderTopStats();

    renderCategoryDistribution();

    renderHighRotation();

    renderMostAndLeastWorn();

    renderCostPerWear();

    renderExtremes();

}


// =====================================================
// TOP STATS
// =====================================================

function renderTopStats() {

    const totalValue =
        clothingItems.reduce(
            (sum, item) =>
                sum + parsePrice(item.price),
            0
        );


    const totalValueElement =
        document.getElementById(
            "totalValue"
        );


    if (totalValueElement) {

        totalValueElement.textContent =
            formatCurrency(totalValue);

    }


    // TOTAL ITEMS

    const totalItemsElement =
        document.getElementById(
            "totalItems"
        );


    if (totalItemsElement) {

        totalItemsElement.textContent =
            clothingItems.length;

    }


    // AVERAGE COST PER WEAR

    const totalWearCount =
        wearHistory.length;


    const averageCostPerWear =
        totalWearCount > 0
            ? totalValue / totalWearCount
            : 0;


    const averageElement =
        document.getElementById(
            "averageCostPerWear"
        );


    if (averageElement) {

        averageElement.textContent =
            formatCurrency(
                averageCostPerWear
            );

    }


    // ITEMS IN ROTATION

    const activeItemIds =
        new Set(
            wearHistory
                .map(
                    record =>
                        Number(record.item_id)
                )
                .filter(
                    id => !isNaN(id)
                )
        );


    const activeItemsElement =
        document.getElementById(
            "activeItems"
        );


    if (activeItemsElement) {

        activeItemsElement.textContent =
            activeItemIds.size;

    }

}


// =====================================================
// CATEGORY DISTRIBUTION
// =====================================================

function renderCategoryDistribution() {

    const categoryCounts = {};


    clothingItems.forEach(item => {

        const category =
            item.category ||
            "Other";


        categoryCounts[category] =
            (categoryCounts[category] || 0) +
            1;

    });


    const entries =
        Object.entries(categoryCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    const total =
        clothingItems.length;


    const categoryTotal =
        document.getElementById(
            "categoryTotal"
        );


    if (categoryTotal) {

        categoryTotal.textContent =
            total;

    }


    const legend =
        document.getElementById(
            "categoryLegend"
        );


    if (!legend) return;


    if (entries.length === 0) {

        legend.innerHTML = `
            <div class="empty-analytics">
                No clothing items available.
            </div>
        `;

        updateDonut([]);

        return;

    }


    const topCategories =
        entries.slice(0, 5);


    legend.innerHTML =
        topCategories
            .map(
                ([category, count], index) => {

                    const percentage =
                        total > 0
                            ? (
                                count /
                                total *
                                100
                            ).toFixed(1)
                            : 0;


                    return `

                        <div class="category-row">

                            <div class="category-left">

                                <div
                                    class="category-dot"
                                    style="
                                        background:
                                        ${getCategoryColor(index)};
                                    "
                                ></div>

                                <span class="category-name">
                                    ${escapeHtml(category)}
                                </span>

                            </div>


                            <div class="category-right">

                                <div class="category-count">
                                    ${count} items
                                </div>

                                <div class="category-percent">
                                    ${percentage}% of total
                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    updateDonut(topCategories);

}


// =====================================================
// DONUT
// =====================================================

function updateDonut(entries) {

    const total =
        clothingItems.length;


    const donutChart =
        document.getElementById(
            "donutChart"
        );


    if (!donutChart) return;


    if (!total) {

        donutChart.style.background =
            "#e8e1dd";

        return;

    }


    let currentDegree = 0;

    const parts = [];


    entries.forEach(
        ([category, count], index) => {

            const degrees =
                (
                    count /
                    total
                ) * 360;


            const color =
                getCategoryColor(index);


            parts.push(
                `${color}
                 ${currentDegree}deg
                 ${currentDegree + degrees}deg`
            );


            currentDegree += degrees;

        }
    );


    parts.push(
        `#e8e1dd
         ${currentDegree}deg
         360deg`
    );


    donutChart.style.background =
        `conic-gradient(${parts.join(",")})`;

}


// =====================================================
// HIGH ROTATION
// =====================================================

function renderHighRotation() {

    const counts =
        getWearCounts();


    const ranked =
        clothingItems
            .map(item => ({

                item,

                count:
                    counts[
                        Number(item.item_id)
                    ] || 0

            }))
            .filter(
                entry =>
                    entry.count > 0
            )
            .sort(
                (a, b) =>
                    b.count - a.count
            )
            .slice(0, 5);


    const list =
        document.getElementById(
            "rotationList"
        );


    if (!list) return;


    if (ranked.length === 0) {

        list.innerHTML = `
            <div style="
                color: rgba(255,255,255,.7);
                font-size:13px;
            ">
                No wear records yet.
            </div>
        `;

        return;

    }


    const highestCount =
        ranked[0].count;


    list.innerHTML =
        ranked
            .map(
                entry => {

                    const percentage =
                        Math.max(
                            8,
                            (
                                entry.count /
                                highestCount
                            ) * 100
                        );


                    return `

                        <div class="rotation-row">

                            <div class="rotation-heading">

                                <span>
                                    ${escapeHtml(
                                        entry.item.name ||
                                        "Unnamed item"
                                    )}
                                </span>

                                <span>
                                    ${entry.count}
                                    ${entry.count === 1
                                        ? "Wear"
                                        : "Wears"}
                                </span>

                            </div>


                            <div class="rotation-bar">

                                <div
                                    class="rotation-fill"
                                    style="
                                        width:
                                        ${percentage}%;
                                    "
                                ></div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// =====================================================
// MOST + LEAST WORN
// =====================================================

function renderMostAndLeastWorn() {

    const counts =
        getWearCounts();


    const ranked =
        clothingItems
            .map(item => ({

                item,

                count:
                    counts[
                        Number(item.item_id)
                    ] || 0

            }));


    const mostWorn =
        [...ranked]
            .sort(
                (a, b) =>
                    b.count - a.count
            )
            .slice(0, 5);


    const leastWorn =
        [...ranked]
            .sort(
                (a, b) =>
                    a.count - b.count
            )
            .slice(0, 5);


    renderWearList(
        "mostWornList",
        mostWorn
    );


    renderWearList(
        "leastWornList",
        leastWorn
    );

}


function renderWearList(
    elementId,
    entries
) {

    const list =
        document.getElementById(
            elementId
        );


    if (!list) return;


    if (entries.length === 0) {

        list.innerHTML = `
            <div class="empty-analytics">
                No clothing items available.
            </div>
        `;

        return;

    }


    list.innerHTML =
        entries
            .map(entry => {

                return `

                    <div class="wear-item">

                        <img
                            class="wear-item-image"
                            src="${getImageSource(
                                entry.item.image
                            )}"
                            alt="${escapeHtml(
                                entry.item.name ||
                                "Clothing item"
                            )}"
                        >

                        <div class="wear-item-info">

                            <div class="wear-item-name">
                                ${escapeHtml(
                                    entry.item.name ||
                                    "Unnamed item"
                                )}
                            </div>

                            <div class="wear-item-meta">
                                ${escapeHtml(
                                    entry.item.category ||
                                    "Other"
                                )}
                            </div>

                        </div>

                        <div class="wear-count">

                            ${entry.count}

                            <small>
                                ${entry.count === 1
                                    ? "wear"
                                    : "wears"}
                            </small>

                        </div>

                    </div>

                `;

            })
            .join("");

}


// =====================================================
// COST PER WEAR
// =====================================================

function renderCostPerWear() {

    const grid =
        document.getElementById(
            "costPerWearGrid"
        );


    if (!grid) return;


    const counts =
        getWearCounts();


    const ranked =
        clothingItems
            .map(item => {

                const count =
                    counts[
                        Number(item.item_id)
                    ] || 0;


                const price =
                    parsePrice(
                        item.price
                    );


                const costPerWear =
                    count > 0
                        ? price / count
                        : price;


                return {

                    item,

                    count,

                    price,

                    costPerWear

                };

            })
            .filter(
                entry =>
                    entry.count > 0
            )
            .sort(
                (a, b) =>
                    a.costPerWear -
                    b.costPerWear
            )
            .slice(0, 6);


    if (ranked.length === 0) {

        grid.innerHTML = `
            <div class="empty-analytics">
                Record some wears to calculate
                cost per wear.
            </div>
        `;

        return;

    }


    grid.innerHTML =
        ranked
            .map(entry => {

                return `

                    <div class="cost-card">

                        <div class="cost-card-top">

                            <img
                                class="cost-image"
                                src="${getImageSource(
                                    entry.item.image
                                )}"
                                alt="${escapeHtml(
                                    entry.item.name ||
                                    "Clothing item"
                                )}"
                            >

                            <div>

                                <div class="cost-item-name">
                                    ${escapeHtml(
                                        entry.item.name ||
                                        "Unnamed item"
                                    )}
                                </div>

                                <div class="cost-item-price">
                                    ${formatCurrency(
                                        entry.price
                                    )}
                                    ·
                                    ${entry.count}
                                    ${entry.count === 1
                                        ? "wear"
                                        : "wears"}
                                </div>

                            </div>

                        </div>


                        <div class="cost-value">

                            <strong>
                                ${formatCurrency(
                                    entry.costPerWear
                                )}
                            </strong>

                            <span>
                                PER WEAR
                            </span>

                        </div>

                    </div>

                `;

            })
            .join("");

}


// =====================================================
// EXTREMES
// =====================================================

function renderExtremes() {

    const grid =
        document.getElementById(
            "extremesGrid"
        );


    if (!grid) return;


    const counts =
        getWearCounts();


    const ranked =
        clothingItems
            .map(item => ({

                item,

                count:
                    counts[
                        Number(item.item_id)
                    ] || 0

            }));


    if (ranked.length === 0) {

        grid.innerHTML = `
            <div class="empty-analytics">
                Add clothing items to see your
                wardrobe extremes.
            </div>
        `;

        return;

    }


    const mostWorn =
        [...ranked]
            .sort(
                (a, b) =>
                    b.count - a.count
            )
            .slice(0, 2);


    const leastWorn =
        [...ranked]
            .sort(
                (a, b) =>
                    a.count - b.count
            )
            .slice(0, 2);


    const cards = [

        ...mostWorn.map(
            (entry, index) => ({

                ...entry,

                type:
                    index === 0
                        ? "MOST WORN"
                        : "RUNNER UP",

                attention: false

            })
        ),

        ...leastWorn.map(
            entry => ({

                ...entry,

                type:
                    entry.count === 0
                        ? "UNUSED"
                        : "LOW ROTATION",

                attention:
                    entry.count === 0

            })
        )

    ];


    const uniqueCards = [];

    const usedIds =
        new Set();


    cards.forEach(card => {

        const id =
            Number(
                card.item.item_id
            );


        if (!usedIds.has(id)) {

            usedIds.add(id);

            uniqueCards.push(card);

        }

    });


    grid.innerHTML =
        uniqueCards
            .slice(0, 4)
            .map(
                card =>
                    createExtremeCard(card)
            )
            .join("");

}


function createExtremeCard(card) {

    const item =
        card.item;


    return `

        <div
            class="
                extreme-card
                ${card.attention
                    ? "attention"
                    : ""}
            "
        >

            <img
                src="${getImageSource(item.image)}"
                alt="${escapeHtml(
                    item.name ||
                    "Clothing item"
                )}"
            >

            <div class="extreme-overlay">

                <span class="extreme-badge">
                    ${card.type}
                </span>

                <div class="extreme-title">
                    ${escapeHtml(
                        item.name ||
                        "Unnamed item"
                    )}
                </div>

                <div class="extreme-subtitle">

                    ${card.count}
                    ${card.count === 1
                        ? "wear"
                        : "wears"}

                    ·

                    ${formatCurrency(
                        parsePrice(item.price)
                    )}

                </div>

            </div>

        </div>

    `;

}


// =====================================================
// WEAR COUNTS
// =====================================================

function getWearCounts() {

    const counts = {};


    wearHistory.forEach(record => {

        const itemId =
            Number(record.item_id);


        if (!isNaN(itemId)) {

            counts[itemId] =
                (counts[itemId] || 0) +
                1;

        }

    });


    return counts;

}


// =====================================================
// EXPORT
// =====================================================

function exportReport() {

    const totalValue =
        clothingItems.reduce(
            (sum, item) =>
                sum + parsePrice(item.price),
            0
        );


    const counts =
        getWearCounts();


    const report = [

        "STYLEVAULT ANALYTICS REPORT",

        "============================",

        "",

        `Total Wardrobe Value:
₹${totalValue.toFixed(2)}`,

        `Total Clothing Items:
${clothingItems.length}`,

        `Items in Rotation:
${Object.keys(counts).length}`,

        `Total Recorded Wears:
${wearHistory.length}`,

        "",

        "Generated by StyleVault"

    ].join("\n");


    const blob =
        new Blob(
            [report],
            {
                type: "text/plain"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "stylevault-analytics-report.txt";


    link.click();


    URL.revokeObjectURL(url);

}


// =====================================================
// PRICE
// =====================================================

function parsePrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }


    if (typeof value === "number") {

        return isNaN(value)
            ? 0
            : value;

    }


    const cleaned =
        String(value)
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .trim();


    const number =
        parseFloat(cleaned);


    return isNaN(number)
        ? 0
        : number;

}


function formatCurrency(value) {

    return `₹${parsePrice(value).toFixed(2)}`;

}


// =====================================================
// IMAGE
// =====================================================

function getImageSource(image) {

    if (!image) {

        return "https://via.placeholder.com/500x500?text=No+Image";

    }


    if (
        typeof image === "string" &&
        image.startsWith("data:")
    ) {

        return image;

    }


    if (
        typeof image === "string" &&
        image.startsWith("http")
    ) {

        return image;

    }


    return `data:image/jpeg;base64,${image}`;

}


// =====================================================
// HELPERS
// =====================================================

function getCategoryColor(index) {

    const colors = [

        "#825156",
        "#586152",
        "#625b6e",
        "#a8b19f",
        "#b3aabf"

    ];


    return colors[
        index % colors.length
    ];

}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// ERROR
// =====================================================

function showError() {

    const pageContent =
        document.querySelector(
            ".page-content"
        );


    if (!pageContent) return;


    pageContent.innerHTML = `

        <div class="empty-analytics">

            <h2>
                Unable to load analytics
            </h2>

            <p>
                Please make sure the server is
                running and try again.
            </p>

        </div>

    `;

}