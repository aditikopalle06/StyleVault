// profile.js


document.addEventListener("DOMContentLoaded", function () {


    const storedUser =
        localStorage.getItem("user");


    const displayName =
        document.getElementById("profileName");


    const username =
        document.getElementById("profileUsername");


    const topProfileName =
        document.getElementById("topProfileName");


    const nameInput =
        document.getElementById("name");


    const usernameInput =
        document.getElementById("username");


    const emailInput =
        document.getElementById("email");


    const saveButton =
        document.getElementById("saveProfileButton");


    const logoutButton =
        document.getElementById("logoutButton");


    const changePasswordButton =
        document.getElementById("changePasswordButton");


    const message =
        document.getElementById("profileMessage");



    // --------------------------------
    // CHECK LOGIN
    // --------------------------------

    const token =
        localStorage.getItem("token");


    if (!token || !storedUser) {

        alert("Please log in first.");

        window.location.href =
            "../login/login.html";

        return;

    }



    // --------------------------------
    // LOAD USER INFORMATION
    // --------------------------------

    let user;


    try {

        user = JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "Unable to read user information:",
            error
        );

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        window.location.href =
            "../login/login.html";

        return;
    }



    const userName =
        user.name || user.username || "User";


    const userUsername =
        user.username || "";


    const userEmail =
        user.email || "";



    // --------------------------------
    // DISPLAY USER INFORMATION
    // --------------------------------

    if (displayName) {

        displayName.textContent =
            userName;

    }


    if (username) {

        username.textContent =
            userUsername
                ? "@" + userUsername
                : "";

    }


    if (topProfileName) {

        topProfileName.textContent =
            userName;

    }



    // --------------------------------
    // FILL ACCOUNT INFORMATION
    // --------------------------------

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



    // --------------------------------
    // SAVE CHANGES
    // --------------------------------

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            function () {


                /*
                 * We are not sending these changes
                 * to the backend yet because the
                 * current backend does not have
                 * a profile update endpoint.
                 *
                 * For now, we only update the
                 * locally stored user information.
                 */


                const updatedUser = {

                    ...user,

                    name:
                        nameInput.value.trim(),

                    username:
                        usernameInput.value.trim(),

                    email:
                        emailInput.value.trim()

                };


                localStorage.setItem(
                    "user",
                    JSON.stringify(updatedUser)
                );


                // Update the page immediately

                if (displayName) {

                    displayName.textContent =
                        updatedUser.name ||
                        updatedUser.username;

                }


                if (username) {

                    username.textContent =
                        updatedUser.username
                            ? "@" +
                              updatedUser.username
                            : "";

                }


                if (topProfileName) {

                    topProfileName.textContent =
                        updatedUser.name ||
                        updatedUser.username;

                }


                if (message) {

                    message.textContent =
                        "Changes saved locally.";

                }

            }
        );

    }



    // --------------------------------
    // CHANGE PASSWORD
    // --------------------------------

    if (changePasswordButton) {

        changePasswordButton.addEventListener(
            "click",
            function () {

                alert(
                    "Change password will be available once the password update feature is added to the backend."
                );

            }
        );

    }



    // --------------------------------
    // LOG OUT
    // --------------------------------

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {


                const confirmLogout =
                    confirm(
                        "Are you sure you want to log out?"
                    );


                if (!confirmLogout) {

                    return;

                }


                localStorage.removeItem("token");

                localStorage.removeItem("user");


                window.location.href =
                    "../login/login.html";

            }
        );

    }

});