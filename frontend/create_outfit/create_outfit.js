// ============================================
// CREATE OUTFIT
// ============================================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}


// ============================================
// VARIABLES
// ============================================

let wardrobeItems = [];
let selectedItems = new Map();

let activeCategory = "all";
let searchText = "";
let zoomLevel = 1;

// Edit mode and initial clothing item
const urlParams = new URLSearchParams(window.location.search);

let editOutfitId = urlParams.get("outfit_id");
const initialItemId = urlParams.get("item_id");

let isEditMode = Boolean(editOutfitId);
let existingOutfit = null;


// ============================================
// DOM ELEMENTS
// ============================================

const wardrobeGrid =
    document.getElementById("wardrobeGrid");

const wardrobeEmpty =
    document.getElementById("wardrobeEmpty");

const wardrobeSearch =
    document.getElementById("wardrobeSearch");

const outfitCanvas =
    document.getElementById("outfitCanvas");

const canvasEmptyMessage =
    document.getElementById("canvasEmptyMessage");

const selectedCount =
    document.getElementById("selectedCount");

const outfitName =
    document.getElementById("outfitName");

const occasion =
    document.getElementById("occasion");

const saveOutfitButton =
    document.getElementById("saveOutfitButton");


// ============================================
// EDIT MODE UI
// ============================================

function setupEditModeUI() {

    if (!isEditMode) {
        return;
    }

    document.title = "Edit Outfit - StyleVault";

    if (saveOutfitButton) {
        saveOutfitButton.innerHTML = `
            <span class="material-symbols-outlined">
                save
            </span>
            Save Changes
        `;
    }
}


// ============================================
// LOAD EXISTING OUTFIT
// ============================================

async function loadExistingOutfit() {

    if (!isEditMode) {
        return;
    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/outfits/${editOutfitId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href =
                "../login/login.html";

            return;
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Could not load outfit."
            );
        }

        existingOutfit =
            data.outfit || data;

        const items =
            data.items || [];

        outfitName.value =
            existingOutfit.outfit_name || "";

        occasion.value =
            existingOutfit.occasion || "";

        selectedItems.forEach(selected => {
            selected.element.remove();
        });

        selectedItems.clear();

        items.forEach(item => {

            const x =
                Number(item.position_x) || 0;

            const y =
                Number(item.position_y) || 0;

            addItemToCanvas(item, x, y);

            const selected =
                selectedItems.get(Number(item.item_id));

            if (selected) {
                selected.element.style.zIndex =
                    String(Number(item.z_index) || 1);
            }
        });

        updateCanvasState();
        renderWardrobe();

    } catch (error) {

        console.error(
            "Load existing outfit error:",
            error
        );

        alert(
            error.message ||
            "Could not load the outfit for editing."
        );

        window.location.href =
            "../outfits/outfits.html";
    }
}


// ============================================
// LOAD USER
// ============================================

function loadUser() {

    try {

        const user =
            JSON.parse(localStorage.getItem("user"));

        if (user) {

            const name =
                user.name ||
                user.username ||
                "Fashion Muse";

            const profileName =
                document.getElementById("profileName");

            if (profileName) {
                profileName.textContent = name;
            }
        }

    } catch (error) {

        console.log("Could not load user");
    }
}


// ============================================
// LOAD WARDROBE
// ============================================

async function loadWardrobe() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/clothing",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href =
                "../login/login.html";

            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load wardrobe");
        }

        const data = await response.json();

        wardrobeItems =
            Array.isArray(data)
                ? data
                : data.clothing ||
                  data.items ||
                  [];

        renderWardrobe();

    } catch (error) {

        console.error(error);

        wardrobeGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:#757871;
            ">
                <span class="material-symbols-outlined">
                    error
                </span>
                <p>Could not load wardrobe.</p>
            </div>
        `;
    }
}


// ============================================
// NORMALIZE CATEGORY
// ============================================

function normalizeCategory(category) {

    if (!category) {
        return "";
    }

    return category
        .toString()
        .toLowerCase()
        .trim();
}


// ============================================
// CATEGORY MATCH
// ============================================

function categoryMatches(item) {

    if (activeCategory === "all") {
        return true;
    }

    const category =
        normalizeCategory(item.category);

    if (activeCategory === "top") {
        return (
            category.includes("top") ||
            category.includes("shirt") ||
            category.includes("t-shirt") ||
            category.includes("blouse") ||
            category.includes("kurti") ||
            category.includes("sweater") 
        );
    }

    if (activeCategory === "bottom") {
        return (
            category.includes("bottom") ||
            category.includes("pant") ||
            category.includes("trouser") ||
            category.includes("jean") ||
            category.includes("skirt") ||
            category.includes("short")
        );
    }

    if (activeCategory === "dress") {
        return (
            category.includes("dress") ||
            category.includes("gown")
        );
    }

    if (activeCategory === "outerwear") {
        return (
            category.includes("outerwear") ||
            category.includes("jacket") ||
            category.includes("coat") ||
            category.includes("blazer") ||
            category.includes("cardigan") ||
            category.includes("vest")
        );
    }

    if (activeCategory === "shoes") {
        return (
            category.includes("shoe") ||
            category.includes("footwear") ||
            category.includes("sandal") ||
            category.includes("heel") ||
            category.includes("boot")
        );
    }

    if (activeCategory === "accessories") {
        return (
            category.includes("accessor") ||
            category.includes("bag") ||
            category.includes("watch") ||
            category.includes("jewellery") ||
            category.includes("jewelry") ||
            category.includes("belt")
        );
    }

    return category === activeCategory;
}


// ============================================
// SEARCH MATCH
// ============================================

function searchMatches(item) {

    if (!searchText) {
        return true;
    }

    const text = [
        item.name,
        item.category,
        item.colour,
        item.season,
        item.occasion
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return text.includes(searchText);
}


// ============================================
// RENDER WARDROBE
// ============================================

function renderWardrobe() {

    wardrobeGrid.innerHTML = "";

    const filteredItems =
        wardrobeItems.filter(item => {
            return (
                categoryMatches(item) &&
                searchMatches(item)
            );
        });

    if (filteredItems.length === 0) {
        wardrobeEmpty.classList.remove("hidden");
        return;
    }

    wardrobeEmpty.classList.add("hidden");

    filteredItems.forEach(item => {
        const card = createWardrobeCard(item);
        wardrobeGrid.appendChild(card);
    });
}


// ============================================
// CREATE WARDROBE CARD
// ============================================

function createWardrobeCard(item) {

    const card = document.createElement("div");

    card.className = "wardrobe-item";
    card.dataset.itemId = item.item_id;

    if (selectedItems.has(Number(item.item_id))) {
        card.classList.add("in-canvas");
    }

    const image = item.image || "";

    card.innerHTML = `
        <div class="wardrobe-image">
            ${
                image
                    ? `
                        <img
                            src="${image}"
                            alt="${escapeHtml(
                                item.name || "Clothing item"
                            )}"
                        >
                    `
                    : `
                        <div style="
                            width:100%;
                            height:100%;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#757871;
                        ">
                            <span class="material-symbols-outlined">
                                checkroom
                            </span>
                        </div>
                    `
            }
        </div>

        <div class="wardrobe-item-info">
            <div class="wardrobe-item-name">
                ${escapeHtml(item.name || "Unnamed item")}
            </div>

            <div class="wardrobe-item-category">
                ${escapeHtml(item.category || "Clothing")}
            </div>
        </div>

        <div class="drag-hint">
            <span class="material-symbols-outlined">
                drag_indicator
            </span>
        </div>
    `;

    card.addEventListener("click", () => {
        addItemToCanvas(item);
    });

    card.draggable = true;

    card.addEventListener("dragstart", event => {
        event.dataTransfer.setData(
            "text/plain",
            String(item.item_id)
        );

        event.dataTransfer.effectAllowed = "copy";
    });

    return card;
}


// ============================================
// CANVAS DROP
// ============================================

outfitCanvas.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
});

outfitCanvas.addEventListener("drop", event => {

    event.preventDefault();

    const itemId = Number(
        event.dataTransfer.getData("text/plain")
    );

    const item = wardrobeItems.find(
        clothing =>
            Number(clothing.item_id) === itemId
    );

    if (!item) {
        return;
    }

    const rect =
        outfitCanvas.getBoundingClientRect();

    const x =
        event.clientX - rect.left - 75;

    const y =
        event.clientY - rect.top - 90;

    addItemToCanvas(item, x, y);
});


// ============================================
// ADD ITEM TO CANVAS
// ============================================

function addItemToCanvas(item, x = null, y = null) {

    const itemId = Number(item.item_id);

    if (selectedItems.has(itemId)) {
        const existing = selectedItems.get(itemId);
        selectCanvasItem(existing.element);
        return;
    }

    if (x === null || y === null) {

        const canvasRect =
            outfitCanvas.getBoundingClientRect();

        const offset = selectedItems.size * 25;

        x =
            canvasRect.width / 2 -
            75 +
            offset;

        y =
            canvasRect.height / 2 -
            90 +
            offset;
    }

    const element =
        createCanvasItem(item, x, y);

    outfitCanvas.appendChild(element);

    selectedItems.set(itemId, {
        item: item,
        element: element
    });

    element.style.zIndex =
        String(selectedItems.size);

    updateCanvasState();
    renderWardrobe();
}


// ============================================
// CREATE CANVAS ITEM
// ============================================

function createCanvasItem(item, x, y) {

    const element =
        document.createElement("div");

    element.className = "canvas-item";
    element.dataset.itemId = item.item_id;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = "1";

    element.innerHTML = `
        ${
            item.image
                ? `
                    <img
                        class="canvas-item-image"
                        src="${item.image}"
                        alt="${escapeHtml(item.name || "")}"
                    >
                `
                : `
                    <div
                        class="canvas-item-image"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#f3ede8;
                        "
                    >
                        <span class="material-symbols-outlined">
                            checkroom
                        </span>
                    </div>
                `
        }

        <button class="remove-item" title="Remove">
            <span class="material-symbols-outlined">
                close
            </span>
        </button>
    `;

    const removeButton =
        element.querySelector(".remove-item");

    removeButton.addEventListener("click", event => {
        event.stopPropagation();
        removeCanvasItem(Number(item.item_id));
    });

    makeCanvasItemDraggable(element);

    element.addEventListener("mousedown", () => {
        selectCanvasItem(element);
    });

    return element;
}


// ============================================
// MAKE CANVAS ITEM DRAGGABLE
// ============================================

function makeCanvasItemDraggable(element) {

    let dragging = false;

    let startX = 0;
    let startY = 0;

    let originalLeft = 0;
    let originalTop = 0;

    element.addEventListener("pointerdown", event => {

        if (event.target.closest(".remove-item")) {
            return;
        }

        event.preventDefault();

        dragging = true;
        selectCanvasItem(element);

        startX = event.clientX;
        startY = event.clientY;

        originalLeft =
            parseFloat(element.style.left) || 0;

        originalTop =
            parseFloat(element.style.top) || 0;

        element.setPointerCapture(event.pointerId);
    });

    element.addEventListener("pointermove", event => {

        if (!dragging) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        let newLeft = originalLeft + deltaX;
        let newTop = originalTop + deltaY;

        const canvasWidth = outfitCanvas.clientWidth;
        const canvasHeight = outfitCanvas.clientHeight;

        const itemWidth = element.offsetWidth;
        const itemHeight = element.offsetHeight;

        newLeft = Math.max(
            0,
            Math.min(newLeft, canvasWidth - itemWidth)
        );

        newTop = Math.max(
            0,
            Math.min(newTop, canvasHeight - itemHeight)
        );

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    });

    element.addEventListener("pointerup", event => {

        dragging = false;

        try {
            element.releasePointerCapture(event.pointerId);
        } catch (error) {
            // Nothing to do.
        }
    });
}


// ============================================
// SELECT CANVAS ITEM
// ============================================

function selectCanvasItem(element) {

    document.querySelectorAll(".canvas-item").forEach(item => {
        item.classList.remove("selected");
    });

    element.classList.add("selected");

    element.style.zIndex =
        String(getHighestZIndex() + 1);
}


// ============================================
// GET HIGHEST Z-INDEX
// ============================================

function getHighestZIndex() {

    let highest = 0;

    document.querySelectorAll(".canvas-item").forEach(element => {

        const value =
            parseInt(element.style.zIndex) || 0;

        if (value > highest) {
            highest = value;
        }
    });

    return highest;
}


// ============================================
// REMOVE CANVAS ITEM
// ============================================

function removeCanvasItem(itemId) {

    const selected = selectedItems.get(itemId);

    if (!selected) {
        return;
    }

    selected.element.remove();
    selectedItems.delete(itemId);

    updateCanvasState();
    renderWardrobe();
}


// ============================================
// UPDATE CANVAS STATE
// ============================================

function updateCanvasState() {

    const count = selectedItems.size;

    selectedCount.textContent =
        `${count} ${count === 1 ? "item" : "items"}`;

    if (count === 0) {
        canvasEmptyMessage.classList.remove("hidden");
    } else {
        canvasEmptyMessage.classList.add("hidden");
    }
}
// ============================================
// CLEAR CANVAS
// ============================================

const clearCanvasButton =
    document.getElementById("clearCanvasButton");

if (clearCanvasButton) {

    clearCanvasButton.addEventListener("click", () => {

        if (selectedItems.size === 0) {
            return;
        }

        const confirmed = confirm(
            "Remove all items from the canvas?"
        );

        if (!confirmed) {
            return;
        }

        selectedItems.forEach(selected => {
            selected.element.remove();
        });

        selectedItems.clear();

        updateCanvasState();
        renderWardrobe();
    });
}


// ============================================
// CATEGORY FILTERS
// ============================================

document.querySelectorAll(".category-button").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".category-button").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        activeCategory = button.dataset.category;

        renderWardrobe();
    });
});


// ============================================
// SEARCH
// ============================================

if (wardrobeSearch) {

    wardrobeSearch.addEventListener("input", event => {

        searchText =
            event.target.value
                .trim()
                .toLowerCase();

        renderWardrobe();
    });
}


// ============================================
// SAVE OUTFIT
// ============================================

if (saveOutfitButton) {
    saveOutfitButton.addEventListener("click", saveOutfit);
}


async function saveOutfit() {

    const name = outfitName.value.trim();
    const selectedOccasion = occasion.value;

    // Validation
    if (!name) {
        alert("Please enter an outfit name.");
        outfitName.focus();
        return;
    }

    if (!selectedOccasion) {
        alert("Please select an occasion.");
        occasion.focus();
        return;
    }

    if (selectedItems.size === 0) {
        alert("Add at least one clothing item to the canvas.");
        return;
    }

    // Get item IDs
    const itemIds = Array.from(selectedItems.keys());

    // Get canvas positions
    const itemPositions =
        Array.from(selectedItems.values()).map(selected => {

            return {
                item_id: Number(selected.item.item_id),

                position_x:
                    parseFloat(selected.element.style.left) || 0,

                position_y:
                    parseFloat(selected.element.style.top) || 0,

                z_index:
                    parseInt(selected.element.style.zIndex) || 1
            };
        });

    console.log("Saving item positions:", itemPositions);

    // Disable button while saving
    saveOutfitButton.disabled = true;

    saveOutfitButton.innerHTML = `
        <span class="material-symbols-outlined">
            progress_activity
        </span>
        Saving...
    `;

    try {

        const url = isEditMode
            ? `http://localhost:5000/api/outfits/${editOutfitId}`
            : "http://localhost:5000/api/outfits";

        const method = isEditMode ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                outfit_name: name,
                occasion: selectedOccasion,
                item_ids: itemIds,
                item_positions: itemPositions
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                (
                    isEditMode
                        ? "Could not update outfit."
                        : "Could not save outfit."
                )
            );
        }

        console.log(
            isEditMode ? "Outfit updated:" : "Outfit saved:",
            data
        );

        alert(
            isEditMode
                ? "Outfit updated successfully!"
                : "Outfit saved successfully!"
        );

        window.location.href =
            "../outfits/outfits.html";

    } catch (error) {

        console.error(
            isEditMode
                ? "Update outfit error:"
                : "Save outfit error:",
            error
        );

        alert(
            error.message ||
            (
                isEditMode
                    ? "Could not update outfit."
                    : "Could not save outfit."
            )
        );

        saveOutfitButton.disabled = false;

        saveOutfitButton.innerHTML = `
            <span class="material-symbols-outlined">
                ${isEditMode ? "save" : "check"}
            </span>
            ${isEditMode ? "Save Changes" : "Save Outfit"}
        `;
    }
}


// ============================================
// ZOOM IN
// ============================================

const zoomIn =
    document.getElementById("zoomIn");

if (zoomIn) {

    zoomIn.addEventListener("click", () => {

        zoomLevel = Math.min(1.5, zoomLevel + 0.1);

        updateZoom();
    });
}


// ============================================
// ZOOM OUT
// ============================================

const zoomOut =
    document.getElementById("zoomOut");

if (zoomOut) {

    zoomOut.addEventListener("click", () => {

        zoomLevel = Math.max(0.7, zoomLevel - 0.1);

        updateZoom();
    });
}


// ============================================
// UPDATE ZOOM
// ============================================

function updateZoom() {

    const zoomValue =
        document.getElementById("zoomValue");

    if (zoomValue) {
        zoomValue.textContent =
            `${Math.round(zoomLevel * 100)}%`;
    }

    outfitCanvas.style.transform =
        `scale(${zoomLevel})`;

    outfitCanvas.style.transformOrigin =
        "center center";
}
// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {

    const links = {

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

    Object.entries(links).forEach(([id, path]) => {

        const link = document.getElementById(id);

        if (!link) {
            return;
        }

        link.addEventListener("click", event => {

            event.preventDefault();

            window.location.href = path;
        });
    });

    // Profile
    document
        .getElementById("profileSection")
        ?.addEventListener("click", () => {

            window.location.href =
                "../profile/profile.html";
        });

    // Top search
    document
        .getElementById("topSearchButton")
        ?.addEventListener("click", () => {

            if (wardrobeSearch) {
                wardrobeSearch.focus();
            }
        });

    // Notifications
    document
        .getElementById("notificationButton")
        ?.addEventListener("click", () => {

            alert("No new notifications.");
        });
}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


// ============================================
// INITIALIZE
// ============================================

loadUser();

setupEditModeUI();

loadWardrobe().then(async function () {

    // Editing an existing outfit takes priority.
    if (isEditMode) {
        await loadExistingOutfit();
        return;
    }

    // If opened from Clothing Details, automatically
    // add that clothing item to the outfit canvas.
    if (initialItemId) {

        const item = wardrobeItems.find(
            clothing =>
                String(clothing.item_id) === String(initialItemId)
        );

        if (item) {

            addItemToCanvas(item);

        } else {

            alert(
                "The selected clothing item could not be found in your wardrobe."
            );
        }
    }
});

setupNavigation();

updateCanvasState();