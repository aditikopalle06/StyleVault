// dashboard.js

document.addEventListener("DOMContentLoaded", function () {

    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    const userNameElement =
        document.getElementById("userName");

    const displayNameElement =
        document.getElementById("displayName");

    const wardrobeCountElement =
        document.getElementById("wardrobeCount");


    // Display logged-in user's name

    if (storedUser) {

        try {

            const user = JSON.parse(storedUser);

            const name =
                user.name || user.username || "User";

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


    // Get clothing items from the backend

    async function loadWardrobeCount() {

        if (!token) {
            console.error("No login token found.");
            return;
        }

        try {

            const response = await fetch(
                "http://localhost:5000/api/clothing",
                {
                    method: "GET",

                    headers: {
                        "Authorization": "Bearer " + token
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                console.error(
                    data.error || "Unable to load wardrobe."
                );

                return;
            }


            const clothingItems = data.items || [];

            const recentItemsElement = document.getElementById("recentItems");

            if (recentItemsElement) {

                if (clothingItems.length === 0) {

                    recentItemsElement.innerHTML = `
                        <div class="empty-wardrobe">

                            <span class="material-symbols-outlined">
                                checkroom
                            </span>

                            <p>Your wardrobe is empty.</p>

                            <span>Add your first clothing item to see it here.</span>

                        </div>
                    `;

                } else {

                    const recentItems =
                        clothingItems.slice(-2).reverse();

                    recentItemsElement.innerHTML = "";

                    recentItems.forEach(function (item) {

                        const itemElement =
                            document.createElement("div");

                        itemElement.className = "recent-item";

                        itemElement.innerHTML = `

                            <img
                                src="${item.image || 'https://via.placeholder.com/300x300?text=No+Image'}"
                                alt="${item.name}"
                            >

                            <p>
                                ${item.name}
                            </p>

                        `;

                        recentItemsElement.appendChild(itemElement);

                    });

                }

            }


            if (wardrobeCountElement) {

                wardrobeCountElement.textContent =
                    clothingItems.length;

            }


        } catch (error) {

            console.error(
                "Error loading wardrobe:",
                error
            );

        }
    }


    loadWardrobeCount();


    // Generate ideas button

    const generateIdeasButton =
        document.getElementById("generateIdeasButton");


    if (generateIdeasButton) {

        generateIdeasButton.addEventListener(
            "click",
            function () {

                alert(
                    "AI outfit suggestions will be available soon."
                );

            }
        );

    }

const dashboardProfile =
    document.getElementById("dashboardProfile");

if (dashboardProfile) {

    dashboardProfile.addEventListener("click", function () {

        window.location.href =
            "../profile/profile.html";

    });

}

});