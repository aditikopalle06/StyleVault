const API_BASE = "http://localhost:5000";

const token = localStorage.getItem("token");

let wearHistory = [];
let clothingItems = [];

let activeFilter = "all";
let editingWearId = null;


// ELEMENTS

const timeline = document.getElementById("timeline");
const emptyState = document.getElementById("emptyState");

const wearModal = document.getElementById("wearModal");
const wearForm = document.getElementById("wearForm");

const wearIdInput = document.getElementById("wearId");
const itemIdInput = document.getElementById("itemId");
const wearDateInput = document.getElementById("wearDate");
const ratingInput = document.getElementById("rating");
const notesInput = document.getElementById("notes");

const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");


// INIT

document.addEventListener("DOMContentLoaded", async () => {

    if (!token) {
        window.location.href = "../login/login.html";
        return;
    }

    setToday();

    setupNavigation();
    setupModal();
    setupFilters();
    setupRating();

    await loadProfile();
    await loadClothing();
    await loadWearHistory();

});


// NAVIGATION

function setupNavigation() {

    document.getElementById("searchButton").addEventListener("click", () => {
        window.location.href = "../wardrobe/wardrobe.html";
    });

    document.getElementById("notificationButton").addEventListener("click", () => {
        alert("No new notifications.");
    });

}


// PROFILE

async function loadProfile() {

    try {

        const response = await fetch(
            `${API_BASE}/api/profile`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) return;

        const data = await response.json();

        const user = data.user || data;

        const name =
            user.name ||
            user.username ||
            user.full_name ||
            "Fashion Muse";

        document.getElementById("profileName").textContent = name;

    } catch (error) {

        console.error("Profile error:", error);

    }

}


// CLOTHING

async function loadClothing() {

    try {

        const response = await fetch(
            `${API_BASE}/api/clothing`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load clothing.");
        }

        const data = await response.json();

        clothingItems =
            Array.isArray(data)
                ? data
                : data.clothing || data.items || [];

        populateClothingSelect();

    } catch (error) {

        console.error("Clothing error:", error);

    }

}


function populateClothingSelect() {

    itemIdInput.innerHTML = `
        <option value="">
            Select a clothing item
        </option>
    `;

    clothingItems.forEach(item => {

        const option = document.createElement("option");

        option.value = item.item_id;

        option.textContent =
            `${item.name || "Unnamed item"}${
                item.category
                    ? ` · ${item.category}`
                    : ""
            }`;

        itemIdInput.appendChild(option);

    });

}


// WEAR HISTORY

async function loadWearHistory() {

    try {

        const response = await fetch(
            `${API_BASE}/api/wear-history`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load wear history.");
        }

        const data = await response.json();

        wearHistory =
            Array.isArray(data)
                ? data
                : data.wearHistory || data.history || [];

        renderStats();
        renderTimeline();

    } catch (error) {

        console.error("Wear history error:", error);

        timeline.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">
                    error
                </span>

                <h3>Unable to load wear history</h3>

                <p>
                    Please make sure the server is running and try again.
                </p>
            </div>
        `;

    }

}


// STATS

function renderStats() {

    const totalItems = clothingItems.length;

    const uniqueItemIds = [
        ...new Set(
            wearHistory.map(record => record.item_id)
        )
    ];

    document.getElementById("uniqueItems").textContent =
        uniqueItemIds.length;

    document.getElementById("totalItems").textContent =
        `out of ${totalItems}`;


    // MOST WORN THIS MONTH

    const now = new Date();

    const month = now.getMonth();
    const year = now.getFullYear();

    const thisMonth = wearHistory.filter(record => {

        const date = parseLocalDate(record.wear_date);

        return (
            date.getMonth() === month &&
            date.getFullYear() === year
        );

    });

    const counts = {};

    thisMonth.forEach(record => {

        counts[record.item_id] =
            (counts[record.item_id] || 0) + 1;

    });

    let mostWornId = null;
    let mostWornCount = 0;

    Object.entries(counts).forEach(([itemId, count]) => {

        if (count > mostWornCount) {

            mostWornId = Number(itemId);
            mostWornCount = count;

        }

    });

    const mostWornItem =
        clothingItems.find(
            item => Number(item.item_id) === mostWornId
        );


    if (mostWornItem) {

        document.getElementById("mostWornName").textContent =
            mostWornItem.name || "Unnamed item";

        document.getElementById("mostWornCount").textContent =
            `${mostWornCount} Wear${mostWornCount === 1 ? "" : "s"}`;

        setImage(
            document.getElementById("mostWornImage"),
            mostWornItem.image
        );

        document.getElementById("wearFrequency").textContent =
            mostWornCount >= 5
                ? "Top 5%"
                : mostWornCount >= 3
                    ? "Top 10%"
                    : "Frequently worn";

        const percentage =
            Math.min(
                100,
                Math.max(
                    10,
                    mostWornCount * 15
                )
            );

        document.getElementById("frequencyFill").style.width =
            `${percentage}%`;

        document.getElementById("mostWornDescription").textContent =
            `${mostWornItem.name || "This piece"} has been one of your most frequently worn pieces this month.`;

    } else {

        document.getElementById("mostWornName").textContent =
            "No wear records this month";

        document.getElementById("mostWornCount").textContent =
            "0 Wears";

        document.getElementById("wearFrequency").textContent =
            "—";

        document.getElementById("frequencyFill").style.width =
            "0%";

        document.getElementById("mostWornDescription").textContent =
            "Log your wears to see your most frequently worn pieces here.";

    }


    // LEAST WORN

    const leastWorn = getLeastWornItem();

    if (leastWorn) {

        document.getElementById("leastWornName").textContent =
            leastWorn.item.name || "Unnamed item";

        if (leastWorn.lastWorn) {

            document.getElementById("leastWornDate").textContent =
                `Last worn: ${formatDate(leastWorn.lastWorn)}`;

        } else {

            document.getElementById("leastWornDate").textContent =
                "Never worn";

        }

        document.getElementById("styleItButton").onclick = () => {

            window.location.href =
                "../create_outfit/create_outfit.html";

        };

    } else {

        document.getElementById("leastWornName").textContent =
            "No data yet";

        document.getElementById("leastWornDate").textContent =
            "Add clothing to your wardrobe";

    }

}


function getLeastWornItem() {

    if (clothingItems.length === 0) {
        return null;
    }

    let result = null;

    clothingItems.forEach(item => {

        const records =
            wearHistory.filter(
                record =>
                    Number(record.item_id) ===
                    Number(item.item_id)
            );

        const lastRecord =
            records
                .slice()
                .sort(
                    (a, b) =>
                        parseLocalDate(b.wear_date) -
                        parseLocalDate(a.wear_date)
                )[0];

        const data = {
            item,
            count: records.length,
            lastWorn: lastRecord
                ? lastRecord.wear_date
                : null
        };

        if (
            !result ||
            data.count < result.count
        ) {

            result = data;

        }

    });

    return result;

}


// TIMELINE

function renderTimeline() {

    const filtered = getFilteredHistory();

    if (filtered.length === 0) {

        timeline.innerHTML = `
            <div class="empty-state">

                <span class="material-symbols-outlined">
                    history
                </span>

                <h3>No wear history yet</h3>

                <p>
                    Log what you're wearing to start building
                    your style history.
                </p>

                <button id="emptyLogButton" class="primary-button">
                    Log Your First Wear
                </button>

            </div>
        `;

        document
            .getElementById("emptyLogButton")
            .addEventListener(
                "click",
                () => openAddModal()
            );

        return;
    }


    const grouped = groupByDate(filtered);

    timeline.innerHTML = `
        <div class="timeline-line"></div>
    `;


    Object.keys(grouped)
        .sort(
            (a, b) =>
                parseLocalDate(b) -
                parseLocalDate(a)
        )
        .forEach(date => {

            const records = grouped[date];

            timeline.appendChild(
                createTimelineEntry(
                    date,
                    records
                )
            );

        });

}


function groupByDate(records) {

    const grouped = {};

    records.forEach(record => {

        const date = normalizeDate(record.wear_date);

        if (!grouped[date]) {
            grouped[date] = [];
        }

        grouped[date].push(record);

    });

    return grouped;

}


function createTimelineEntry(date, records) {

    const entry = document.createElement("div");

    entry.className = "timeline-entry";


    const dateObject =
        parseLocalDate(date);


    const dateColumn =
        document.createElement("div");

    dateColumn.className = "timeline-date";

    dateColumn.innerHTML = `
        <div class="timeline-dot"></div>

        <div class="month-day">
            ${dateObject.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            )}
        </div>

        <div class="weekday">
            ${dateObject.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            )}
        </div>
    `;


    const content =
        document.createElement("div");

    content.className = "timeline-content";


    const items =
        records.map(record => {

            return clothingItems.find(
                item =>
                    Number(item.item_id) ===
                    Number(record.item_id)
            ) || {
                item_id: record.item_id,
                name: record.name,
                image: record.image,
                price: 0
            };

        });


    renderWearRecords(content, records, items);

    entry.appendChild(dateColumn);
    entry.appendChild(content);

    return entry;

}



function renderWearRecords(container, records, items) {
    container.innerHTML = `
        <div class="timeline-top">
            <span class="timeline-tag">
                ${records.length === 1
                    ? escapeHtml(items[0]?.category || "Wardrobe")
                    : `${records.length} Items Worn`}
            </span>
        </div>

        <div class="item-grid ${records.length === 1 ? "single-record-grid" : ""}">
            ${items.map((item, index) => {
                const record = records[index];

                const wearCount = wearHistory.filter(
                    r => Number(r.item_id) === Number(record.item_id)
                ).length;

                return `
                    <div class="item-card">
                        ${records.length > 1 ? `
                            <div class="item-card-top">
                                <span class="timeline-tag">
                                    ${escapeHtml(item.category || "Wardrobe")}
                                </span>

                                <div class="timeline-actions">
                                    <button type="button"
                                        class="small-action edit-wear"
                                        data-id="${record.wear_id}"
                                        title="Edit">
                                        <span class="material-symbols-outlined">edit</span>
                                    </button>

                                    <button type="button"
                                        class="small-action delete-wear"
                                        data-id="${record.wear_id}"
                                        title="Delete">
                                        <span class="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        ` : ""}

                        <div class="item-image">
                            <img
                                src="${getImageSource(item.image)}"
                                alt="${escapeHtml(item.name || "Clothing item")}"
                            >
                        </div>

                        <span class="item-name">
                            ${escapeHtml(item.name || "Unnamed item")}
                        </span>

                        <div class="item-wear-count">
                            Worn ${wearCount} ${wearCount === 1 ? "time" : "times"}
                        </div>

                        ${record.rating ? `
                            <div class="rating">
                                ${"★".repeat(Number(record.rating))}${"☆".repeat(5 - Number(record.rating))}
                            </div>
                        ` : ""}

                        ${record.notes ? `
                            <p class="item-notes">
                                ${escapeHtml(record.notes)}
                            </p>
                        ` : ""}
                    </div>
                `;
            }).join("")}
        </div>

        ${records.length === 1 ? `
            <div class="timeline-actions single-record-actions">
                <button type="button"
                    class="small-action edit-wear"
                    data-id="${records[0].wear_id}"
                    title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>

                <button type="button"
                    class="small-action delete-wear"
                    data-id="${records[0].wear_id}"
                    title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        ` : ""}
    `;

    attachRecordButtons(container);
}



// BUTTONS

function attachRecordButtons(container) {

    container
        .querySelectorAll(".edit-wear")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openEditModal(
                        Number(button.dataset.id)
                    )
            );

        });


    container
        .querySelectorAll(".delete-wear")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteWear(
                        Number(button.dataset.id)
                    )
            );

        });

}


// FILTER

function setupFilters() {

    const filterButton =
        document.getElementById("filterButton");

    const filterPanel =
        document.getElementById("filterPanel");


    filterButton.addEventListener(
        "click",
        () => {

            filterPanel.classList.toggle("show");

        }
    );


    document
        .querySelectorAll(".filter-option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".filter-option")
                        .forEach(
                            b =>
                                b.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add("active");

                    activeFilter =
                        button.dataset.filter;

                    renderTimeline();

                }
            );

        });


    document
        .getElementById("dateFilterButton")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById("filterPanel")
                    .classList.add("show");

            }
        );

}


// FILTER LOGIC

function getFilteredHistory() {

    const today =
        new Date();

    return wearHistory.filter(record => {

        const date =
            parseLocalDate(record.wear_date);

        if (activeFilter === "all") {
            return true;
        }


        if (activeFilter === "month") {

            return (
                date.getMonth() ===
                    today.getMonth() &&
                date.getFullYear() ===
                    today.getFullYear()
            );

        }


        if (
            activeFilter === "30" ||
            activeFilter === "90"
        ) {

            const days =
                Number(activeFilter);

            const cutoff =
                new Date(today);

            cutoff.setDate(
                today.getDate() - days
            );

            return date >= cutoff;

        }

        return true;

    });

}


// MODAL

function setupModal() {

    document
        .getElementById("logWearButton")
        .addEventListener(
            "click",
            () => openAddModal()
        );


    document
        .getElementById("emptyLogButton")
        ?.addEventListener(
            "click",
            () => openAddModal()
        );


    document
        .getElementById("closeModalButton")
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("cancelModalButton")
        .addEventListener(
            "click",
            closeModal
        );


    wearModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                wearModal
            ) {
                closeModal();
            }

        }
    );


    wearForm.addEventListener(
        "submit",
        saveWear
    );

}


function openAddModal() {

    editingWearId = null;

    modalTitle.textContent =
        "Log Today's Wear";

    wearForm.reset();

    wearIdInput.value = "";

    ratingInput.value = "";

    clearRating();

    setToday();

    formError.textContent = "";

    wearModal.classList.add("show");

}


function openEditModal(wearId) {

    const record =
        wearHistory.find(
            item =>
                Number(item.wear_id) ===
                Number(wearId)
        );

    if (!record) return;

    editingWearId =
        Number(wearId);

    modalTitle.textContent =
        "Edit Wear Record";

    wearIdInput.value =
        record.wear_id;

    itemIdInput.value =
        record.item_id;

    wearDateInput.value =
        normalizeDate(
            record.wear_date
        );

    ratingInput.value =
        record.rating || "";

    notesInput.value =
        record.notes || "";

    setRating(
        Number(record.rating) || 0
    );

    formError.textContent = "";

    wearModal.classList.add("show");

}


function closeModal() {

    wearModal.classList.remove("show");

    editingWearId = null;

}


// SAVE

async function saveWear(event) {

    event.preventDefault();

    formError.textContent = "";

    const item_id =
        Number(itemIdInput.value);

    const wear_date =
        wearDateInput.value;

    const rating =
        ratingInput.value
            ? Number(ratingInput.value)
            : null;

    const notes =
        notesInput.value.trim();


    if (!item_id || !wear_date) {

        formError.textContent =
            "Please select an item and date.";

        return;

    }


    const payload = {
        item_id,
        wear_date,
        rating,
        notes
    };


    try {

        const url =
            editingWearId
                ? `${API_BASE}/api/wear-history/${editingWearId}`
                : `${API_BASE}/api/wear-history`;

        const method =
            editingWearId
                ? "PUT"
                : "POST";


        const response =
            await fetch(
                url,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`
                    },
                    body:
                        JSON.stringify(payload)
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to save wear record."
            );

        }


        closeModal();

        await loadWearHistory();


    } catch (error) {

        console.error(error);

        formError.textContent =
            error.message;

    }

}


// DELETE

async function deleteWear(wearId) {

    const confirmed =
        confirm(
            "Delete this wear history record?"
        );

    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/wear-history/${wearId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to delete record."
            );

        }


        await loadWearHistory();


    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// RATING

function setupRating() {

    document
        .querySelectorAll(
            "#ratingSelector button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setRating(
                        Number(
                            button.dataset.rating
                        )
                    );

                }
            );

        });

}


function setRating(value) {

    ratingInput.value =
        value || "";

    document
        .querySelectorAll(
            "#ratingSelector button"
        )
        .forEach(button => {

            const rating =
                Number(
                    button.dataset.rating
                );

            button.classList.toggle(
                "active",
                rating <= value
            );

        });

}


function clearRating() {

    setRating(0);

}


// DATE HELPERS

function setToday() {

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

    wearDateInput.value =
        `${year}-${month}-${day}`;

}


function normalizeDate(value) {

    if (!value) return "";

    return String(value)
        .slice(0, 10);

}


function parseLocalDate(value) {

    const normalized =
        normalizeDate(value);

    const [
        year,
        month,
        day
    ] =
        normalized
            .split("-")
            .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );

}


function formatDate(value) {

    return parseLocalDate(
        value
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// IMAGE

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


function setImage(element, image) {

    element.src =
        getImageSource(image);

}


// CURRENCY

function formatCurrency(value) {

    const number =
        Number(value) || 0;

    return `₹${number.toFixed(2)}`;

}


// SECURITY

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}