// profile.js


const API_BASE =
    "http://localhost:5000";


document.addEventListener(
    "DOMContentLoaded",
    async function () {


        // =====================================================
        // ELEMENTS
        // =====================================================

        const displayName =
            document.getElementById(
                "profileName"
            );

        const usernameDisplay =
            document.getElementById(
                "profileUsername"
            );

        const topProfileName =
            document.getElementById(
                "topProfileName"
            );

        const nameInput =
            document.getElementById(
                "name"
            );

        const usernameInput =
            document.getElementById(
                "username"
            );

        const emailInput =
            document.getElementById(
                "email"
            );

        const saveButton =
            document.getElementById(
                "saveProfileButton"
            );

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        const changePasswordButton =
            document.getElementById(
                "changePasswordButton"
            );

        const message =
            document.getElementById(
                "profileMessage"
            );


        // =====================================================
        // LOGIN CHECK
        // =====================================================

        let token =
            localStorage.getItem(
                "token"
            );


        if (!token) {

            window.location.href =
                "../login/login.html";

            return;

        }


        // =====================================================
        // NAVIGATION
        // =====================================================

        setupNavigation();


        // =====================================================
        // LOAD PROFILE FROM DATABASE
        // =====================================================

        await loadProfile();


        // =====================================================
        // SAVE PROFILE
        // =====================================================

        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveProfile
            );

        }


        // =====================================================
        // CHANGE PASSWORD
        // =====================================================

        if (changePasswordButton) {

            changePasswordButton.addEventListener(
                "click",
                function () {

                    alert(
                        "Change password feature will be added later."
                    );

                }
            );

        }


        // =====================================================
        // LOGOUT
        // =====================================================

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    const confirmed =
                        confirm(
                            "Are you sure you want to log out?"
                        );


                    if (!confirmed) {

                        return;

                    }


                    localStorage.removeItem(
                        "token"
                    );

                    localStorage.removeItem(
                        "user"
                    );


                    window.location.href =
                        "../login/login.html";

                }
            );

        }


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


                displayUser(
                    user
                );


            } catch (error) {

                console.error(
                    "Profile loading error:",
                    error
                );


                if (message) {

                    message.textContent =
                        "Unable to load profile.";

                }

            }

        }


        // =====================================================
        // DISPLAY USER
        // =====================================================

        function displayUser(user) {


            const userName =
                user.name ||
                user.username ||
                "User";


            const userUsername =
                user.username ||
                "";


            const userEmail =
                user.email ||
                "";


            // ---------------------------------------------
            // PROFILE SUMMARY
            // ---------------------------------------------

            if (displayName) {

                displayName.textContent =
                    userName;

            }


            if (usernameDisplay) {

                usernameDisplay.textContent =
                    userUsername
                        ? "@" + userUsername
                        : "";

            }


            // ---------------------------------------------
            // TOP PROFILE
            // ---------------------------------------------

            if (topProfileName) {

                topProfileName.textContent =
                    userName;

            }


            // ---------------------------------------------
            // FORM
            // ---------------------------------------------

            if (nameInput) {

                nameInput.value =
                    userName;

            }


            if (usernameInput) {

                usernameInput.value =
                    userUsername;

            }


            if (emailInput) {

                emailInput.value =
                    userEmail;

            }


            // ---------------------------------------------
            // UPDATE LOCAL STORAGE
            // ---------------------------------------------

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

        }


        // =====================================================
        // SAVE PROFILE
        // =====================================================

        async function saveProfile() {


            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";


            const username =
                usernameInput
                    ? usernameInput.value.trim()
                    : "";


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (
                !name ||
                !username ||
                !email
            ) {

                showMessage(
                    "Please fill in all fields."
                );

                return;

            }


            try {

                saveButton.disabled =
                    true;


                saveButton.textContent =
                    "Saving...";


                const response =
                    await fetch(
                        `${API_BASE}/api/profile`,
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " + token

                            },

                            body:
                                JSON.stringify({

                                    name:
                                        name,

                                    username:
                                        username,

                                    email:
                                        email

                                })

                        }
                    );


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

                    showMessage(
                        data.error ||
                        "Unable to save changes."
                    );

                    return;

                }


                // -----------------------------------------
                // UPDATE LOCAL STORAGE
                // -----------------------------------------

                const updatedUser =
                    data.user;


                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        updatedUser
                    )
                );


                // -----------------------------------------
                // UPDATE PAGE
                // -----------------------------------------

                displayUser(
                    updatedUser
                );


                showMessage(
                    "Changes saved successfully."
                );


            } catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );


                showMessage(
                    "Unable to save changes."
                );


            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Save Changes";

            }

        }


        // =====================================================
        // MESSAGE
        // =====================================================

        function showMessage(text) {

            if (!message) {

                return;

            }


            message.textContent =
                text;


            setTimeout(
                function () {

                    message.textContent =
                        "";

                },
                3000
            );

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
        // NAVIGATION
        // =====================================================

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
                    "../preferences/preferences.html"

            };


            Object.keys(
                navigation
            ).forEach(
                function (id) {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (!element) {

                        return;

                    }


                    element.href =
                        navigation[id];

                }
            );


            // ---------------------------------------------
            // AI ASSISTANT
            // ---------------------------------------------

            const aiLink =
                document.getElementById(
                    "ai-link"
                );


            if (aiLink) {

                aiLink.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        alert(
                            "AI Outfit Assistant will be available soon."
                        );

                    }
                );

            }


            // ---------------------------------------------
            // TOP PROFILE
            // ---------------------------------------------

            const topProfile =
                document.getElementById(
                    "topProfile"
                );


            if (topProfile) {

                topProfile.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "../profile/profile.html";

                    }
                );

            }

        }

    }
);