
document.addEventListener("DOMContentLoaded", function () {

    // --------------------------------
    // LOGIN INFORMATION
    // --------------------------------

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // --------------------------------
    // ELEMENTS
    // --------------------------------

    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const detailsContainer = document.getElementById("detailsContainer");
    const displayName = document.getElementById("displayName");
    const clothingImage = document.getElementById("clothingImage");
    const imageColour = document.getElementById("imageColour");
    const colourDot = document.getElementById("colourDot");
    const itemCategory = document.getElementById("itemCategory");
    const itemName = document.getElementById("itemName");
    const itemTags = document.getElementById("itemTags");
    const infoCategory = document.getElementById("infoCategory");
    const infoColour = document.getElementById("infoColour");
    const infoSeason = document.getElementById("infoSeason");
    const infoPrice = document.getElementById("infoPrice");
    const infoSize = document.getElementById("infoSize");
    const infoOccasion = document.getElementById("infoOccasion");
    const extraInfo = document.getElementById("extraInfo");
    const costPerWear = document.getElementById("costPerWear");

    // The first metric number in the metrics card is the wear count.
    const wearsCount = document.querySelector(
        ".metrics-values .metric .metric-number"
    );

    let currentItem = null;

    // --------------------------------
    // DISPLAY USER NAME
    // --------------------------------

    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);

            if (displayName) {
                displayName.textContent =
                    user.name || user.username || "User";
            }
        } catch (error) {
            console.error("Unable to read user information:", error);
        }
    }

    // --------------------------------
    // CHECK TOKEN
    // --------------------------------

    if (!token) {
        alert("Please login again.");
        window.location.href = "../login/login.html";
        return;
    }

    // --------------------------------
    // GET ITEM ID
    // --------------------------------

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get("item_id");

    if (!itemId) {
        showError();
        console.error("No clothing item ID found in URL.");
        return;
    }

    // --------------------------------
    // LOAD CLOTHING ITEM
    // --------------------------------

    async function loadClothingItem() {
        try {
            const response = await fetch(
                `http://localhost:5000/api/clothing/${itemId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                handleExpiredSession();
                return;
            }

            if (!response.ok || !data.item) {
                console.error(
                    data.error || "Unable to load clothing item."
                );
                showError();
                return;
            }

            currentItem = data.item;
            displayClothingItem(currentItem);

            // Load actual wear metrics after loading the item.
            await loadWearMetrics();

        } catch (error) {
            console.error("Error loading clothing item:", error);
            showError();
        }
    }

    // --------------------------------
    // DISPLAY CLOTHING
    // --------------------------------

    function displayClothingItem(item) {
        itemName.textContent = item.name || "Unnamed Item";

        const category = formatText(item.category);
        itemCategory.textContent = category.toUpperCase();
        infoCategory.textContent = category;

        const colour = formatText(item.colour);
        imageColour.textContent = colour;
        infoColour.textContent = colour;

        infoSeason.textContent = formatText(item.season);

        if (
            item.price !== null &&
            item.price !== undefined &&
            item.price !== ""
        ) {
            infoPrice.textContent = "₹" + item.price;
        } else {
            infoPrice.textContent = "Not specified";
        }

        infoSize.textContent = item.size
            ? formatText(item.size)
            : "Not specified";

        infoOccasion.textContent = item.occasion
            ? formatText(item.occasion)
            : "Not specified";

        extraInfo.textContent = item.extra_info
            ? item.extra_info
            : "No additional information added.";

        clothingImage.src = item.image
            ? item.image
            : "https://via.placeholder.com/500x600?text=No+Image";

        clothingImage.alt = item.name || "Clothing item";

        setColourDot(item.colour);
        createTags(item.season, item.occasion);

        loadingState.style.display = "none";
        detailsContainer.style.display = "flex";
    }

    // --------------------------------
    // LOAD WEAR METRICS
    // --------------------------------

    async function loadWearMetrics() {
        try {
            const response = await fetch(
                "http://localhost:5000/api/wear-history",
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                handleExpiredSession();
                return;
            }

            if (!response.ok) {
                throw new Error("Unable to load wear history.");
            }

            const records = await response.json();

            // Only count wears belonging to this clothing item.
            const itemWears = records.filter(function (record) {
                return String(record.item_id) === String(itemId);
            });

            const numberOfWears = itemWears.length;

            if (wearsCount) {
                wearsCount.textContent = numberOfWears;
            }

            const price = Number(currentItem.price);

            if (
                numberOfWears > 0 &&
                currentItem.price !== null &&
                currentItem.price !== undefined &&
                currentItem.price !== "" &&
                Number.isFinite(price) &&
                price >= 0
            ) {
                const perWear = price / numberOfWears;

                costPerWear.textContent = "₹" +
                    perWear.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
            } else {
                costPerWear.textContent = "—";
            }

        } catch (error) {
            console.error("Error loading wear metrics:", error);

            // Don't present a failed request as a confirmed zero.
            if (wearsCount) {
                wearsCount.textContent = "—";
            }

            costPerWear.textContent = "—";
        }
    }

    // --------------------------------
    // CREATE TAGS
    // --------------------------------

    function createTags(season, occasion) {
        itemTags.innerHTML = "";

        if (season) {
            const seasonTag = document.createElement("div");
            seasonTag.className = "item-tag tag-season";

            const icon = document.createElement("span");
            icon.className = "material-symbols-outlined";
            icon.textContent = "ac_unit";

            seasonTag.appendChild(icon);
            seasonTag.appendChild(
                document.createTextNode(" " + formatText(season))
            );

            itemTags.appendChild(seasonTag);
        }

        if (occasion) {
            const occasionTag = document.createElement("div");
            occasionTag.className = "item-tag tag-occasion";

            const icon = document.createElement("span");
            icon.className = "material-symbols-outlined";
            icon.textContent = "event";

            occasionTag.appendChild(icon);
            occasionTag.appendChild(
                document.createTextNode(" " + formatText(occasion))
            );

            itemTags.appendChild(occasionTag);
        }
    }

    // --------------------------------
    // COLOUR DOT
    // --------------------------------

    function setColourDot(colour) {
        if (!colour) {
            colourDot.style.background = "#d4cec5";
            return;
        }

        const colourMap = {
            black: "#222222",
            white: "#f8f8f8",
            blue: "#4b76a8",
            red: "#b85c5c",
            pink: "#d993a7",
            green: "#71866d",
            yellow: "#d9bd63",
            brown: "#87694f",
            beige: "#d8c5a8",
            grey: "#989898",
            gray: "#989898",
            purple: "#88729c",
            orange: "#cf8955",
            navy: "#34445c"
        };

        const key = colour.toLowerCase().trim();
        colourDot.style.background = colourMap[key] || "#b7afa5";
    }

    // --------------------------------
    // FORMAT TEXT
    // --------------------------------

    function formatText(value) {
        if (!value) {
            return "Not specified";
        }

        return String(value)
            .replace(/-/g, " ")
            .replace(/_/g, " ")
            .replace(/\b\w/g, function (letter) {
                return letter.toUpperCase();
            });
    }

    // --------------------------------
    // EXPIRED SESSION
    // --------------------------------

    function handleExpiredSession() {
        alert("Your session has expired. Please login again.");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "../login/login.html";
    }

    // --------------------------------
    // SHOW ERROR
    // --------------------------------

    function showError() {
        loadingState.style.display = "none";
        detailsContainer.style.display = "none";
        errorState.style.display = "flex";
    }

    // --------------------------------
    // BACK TO WARDROBE
    // --------------------------------

    function goBackToWardrobe() {
        window.location.href = "../wardrobe/wardrobe.html";
    }

    const backButtonMobile = document.getElementById("backButtonMobile");
    const backFromErrorButton = document.getElementById("backFromErrorButton");

    if (backButtonMobile) {
        backButtonMobile.addEventListener("click", goBackToWardrobe);
    }

    if (backFromErrorButton) {
        backFromErrorButton.addEventListener("click", goBackToWardrobe);
    }

    // --------------------------------
    // PROFILE BUTTON
    // --------------------------------

    const profileButton = document.getElementById("profileButton");

    if (profileButton) {
        profileButton.addEventListener("click", function () {
            window.location.href = "../profile/profile.html";
        });
    }

    // --------------------------------
    // EDIT BUTTONS
    // --------------------------------

    const editButton = document.getElementById("editButton");
    const editButtonMobile = document.getElementById("editButtonMobile");

    function editClothing() {
        window.location.href =
            `../add_clothing/add_clothing.html?item_id=${itemId}`;
    }

    if (editButton) {
        editButton.addEventListener("click", editClothing);
    }

    if (editButtonMobile) {
        editButtonMobile.addEventListener("click", editClothing);
    }

    // --------------------------------
    // DELETE CLOTHING
    // --------------------------------

    const deleteButton = document.getElementById("deleteButton");

    if (deleteButton) {
        deleteButton.addEventListener("click", async function () {
            const confirmed = confirm(
                "Are you sure you want to delete this clothing item?"
            );

            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost:5000/api/clothing/${itemId}`,
                    {
                        method: "DELETE",
                        headers: {
                            "Authorization": "Bearer " + token
                        }
                    }
                );

                let data = {};

                try {
                    data = await response.json();
                } catch (error) {
                    // The server may return an empty response.
                }

                if (response.status === 401 || response.status === 403) {
                    handleExpiredSession();
                    return;
                }

                if (!response.ok) {
                    alert(data.error || "Unable to delete clothing item.");
                    return;
                }

                alert("Clothing item deleted successfully.");
                goBackToWardrobe();

            } catch (error) {
                console.error("Error deleting clothing:", error);
                alert("Something went wrong while deleting the item.");
            }
        });
    }

    // --------------------------------
// ADD TO OUTFIT
// --------------------------------

const addToOutfitButton =
    document.getElementById("addToOutfitButton");

if (addToOutfitButton) {
    addToOutfitButton.addEventListener("click", function () {
        if (!currentItem || !currentItem.item_id) {
            alert("Unable to identify this clothing item.");
            return;
        }

        window.location.href =
            `../create_outfit/create_outfit.html?item_id=${encodeURIComponent(currentItem.item_id)}`;
    });
}

    // --------------------------------
    // LOG WEAR
    // --------------------------------

    const logWearButton = document.getElementById("logWearButton");

    if (logWearButton) {
        logWearButton.addEventListener("click", async function () {
            if (logWearButton.disabled) {
                return;
            }

            const originalButtonHTML = logWearButton.innerHTML;

            logWearButton.disabled = true;
            logWearButton.textContent = "Logging Wear...";

            try {
                // Build the date in local time, avoiding UTC date shifts.
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, "0");
                const day = String(now.getDate()).padStart(2, "0");
                const wearDate = `${year}-${month}-${day}`;

                const response = await fetch(
                    "http://localhost:5000/api/wear-history",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            item_id: itemId,
                            wear_date: wearDate
                        })
                    }
                );

                let data = {};

                try {
                    data = await response.json();
                } catch (error) {
                    // The response may not contain JSON.
                }

                if (response.status === 401 || response.status === 403) {
                    handleExpiredSession();
                    return;
                }

                if (!response.ok) {
                    alert(
                        data.error ||
                        "Unable to log this wear. Please try again."
                    );
                    return;
                }

                // Refresh the metrics from the saved database records.
                await loadWearMetrics();

                alert("Wear logged successfully! 💗");

            } catch (error) {
                console.error("Error logging wear:", error);

                alert(
                    "Could not connect to the server. Please make sure " +
                    "the backend is running and try again."
                );

            } finally {
                logWearButton.disabled = false;
                logWearButton.innerHTML = originalButtonHTML;
            }
        });
    }

    // --------------------------------
    // START
    // --------------------------------

    detailsContainer.style.display = "none";
    loadClothingItem();

});
