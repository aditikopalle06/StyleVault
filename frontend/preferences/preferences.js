// preferences.js


document.addEventListener("DOMContentLoaded", function () {


    const token = localStorage.getItem("token");


    const storedUser = localStorage.getItem("user");


    const displayName =
        document.getElementById("displayName");


    const preferencesForm =
        document.getElementById("preferencesForm");


    const additionalPreferences =
        document.getElementById("additionalPreferences");


    const saveButton =
        document.getElementById("savePreferencesButton");


    const saveMessage =
        document.getElementById("saveMessage");



    // --------------------------------
    // DISPLAY LOGGED-IN USER
    // --------------------------------

    if (storedUser && displayName) {

        try {

            const user = JSON.parse(storedUser);

            displayName.textContent =
                user.name || user.username || "User";

        } catch (error) {

            console.error(
                "Unable to read user information:",
                error
            );

        }
    }



    // --------------------------------
    // SELECT PREFERENCE OPTIONS
    // --------------------------------

    const optionGroups =
        document.querySelectorAll(".option-group");


    optionGroups.forEach(function (group) {


        const options =
            group.querySelectorAll(".option");


        options.forEach(function (option) {


            option.addEventListener(
                "click",
                function () {


                    // Fit preference allows only one option

                    if (
                        group.classList.contains(
                            "single-select"
                        )
                    ) {

                        options.forEach(function (item) {

                            item.classList.remove(
                                "selected"
                            );

                        });

                        option.classList.add(
                            "selected"
                        );

                    } else {

                        // Other preferences allow
                        // multiple selections

                        option.classList.toggle(
                            "selected"
                        );

                    }

                }
            );

        });

    });



    // --------------------------------
    // LOAD SAVED PREFERENCES
    // --------------------------------

    async function loadPreferences() {


        if (!token) {

            console.error(
                "No login token found."
            );

            return;
        }


        try {


            const response = await fetch(
                "http://localhost:5000/api/preferences",
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


            // A new user may not have
            // preferences yet.

            if (response.status === 404) {

                return;

            }


            if (!response.ok) {

                console.error(
                    data.error ||
                    "Unable to load preferences."
                );

                return;

            }


            // Load multi-select preferences

            selectSavedOptions(
                "preferred_styles",
                data.preferences.preferred_styles
            );


            selectSavedOptions(
                "preferred_colours",
                data.preferences.preferred_colours
            );


            selectSavedOptions(
                "preferred_occasions",
                data.preferences.preferred_occasions
            );


            selectSavedOptions(
                "preferred_seasons",
                data.preferences.preferred_seasons
            );


            // Load fit preference

            selectSavedFit(
                data.preferences.preferred_fit
            );


            // Load additional preferences

            if (additionalPreferences) {

                additionalPreferences.value =
                    data.preferences.additional_preferences ||
                    "";

            }


        } catch (error) {

            console.error(
                "Error loading preferences:",
                error
            );

        }

    }



    // --------------------------------
    // SELECT SAVED OPTIONS
    // --------------------------------

    function selectSavedOptions(
        groupName,
        savedValues
    ) {


        if (!Array.isArray(savedValues)) {
            return;
        }


        const group =
            document.querySelector(
                `[data-group="${groupName}"]`
            );


        if (!group) {
            return;
        }


        const options =
            group.querySelectorAll(".option");


        options.forEach(function (option) {


            const value =
                option.dataset.value;


            if (savedValues.includes(value)) {

                option.classList.add(
                    "selected"
                );

            }

        });

    }



    // --------------------------------
    // SELECT SAVED FIT
    // --------------------------------

    function selectSavedFit(savedFit) {


        if (!savedFit) {
            return;
        }


        const group =
            document.querySelector(
                '[data-group="preferred_fit"]'
            );


        if (!group) {
            return;
        }


        const options =
            group.querySelectorAll(".option");


        options.forEach(function (option) {


            if (
                option.dataset.value ===
                savedFit
            ) {

                option.classList.add(
                    "selected"
                );

            }

        });

    }



    // --------------------------------
    // GET SELECTED OPTIONS
    // --------------------------------

    function getSelectedValues(groupName) {


        const group =
            document.querySelector(
                `[data-group="${groupName}"]`
            );


        if (!group) {
            return [];
        }


        const selected =
            group.querySelectorAll(
                ".option.selected"
            );


        return Array.from(selected).map(
            function (option) {

                return option.dataset.value;

            }
        );

    }



    // --------------------------------
    // SAVE PREFERENCES
    // --------------------------------

    preferencesForm.addEventListener(
        "submit",
        async function (event) {


            event.preventDefault();


            if (!token) {

                alert(
                    "Please log in again."
                );

                return;

            }


            const preferences = {

                preferred_styles:
                    getSelectedValues(
                        "preferred_styles"
                    ),

                preferred_colours:
                    getSelectedValues(
                        "preferred_colours"
                    ),

                preferred_occasions:
                    getSelectedValues(
                        "preferred_occasions"
                    ),

                preferred_seasons:
                    getSelectedValues(
                        "preferred_seasons"
                    ),

                preferred_fit:
                    getSelectedValues(
                        "preferred_fit"
                    )[0] || null,

                additional_preferences:
                    additionalPreferences
                        ? additionalPreferences.value.trim()
                        : ""

            };


            saveButton.disabled = true;


            if (saveMessage) {

                saveMessage.textContent =
                    "Saving...";

            }


            try {


                const response = await fetch(
                    "http://localhost:5000/api/preferences",
                    {
                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " + token

                        },

                        body: JSON.stringify(
                            preferences
                        )

                    }
                );


                const data =
                    await response.json();


                if (!response.ok) {

                    if (saveMessage) {

                        saveMessage.textContent =
                            data.error ||
                            "Unable to save preferences.";

                    }

                    return;

                }


                if (saveMessage) {

                    saveMessage.textContent =
                        "Preferences saved successfully.";

                }


            } catch (error) {


                console.error(
                    "Error saving preferences:",
                    error
                );


                if (saveMessage) {

                    saveMessage.textContent =
                        "Unable to connect to the server.";

                }

            } finally {

                saveButton.disabled = false;

            }

        }
    );

const preferencesProfile =
    document.getElementById("preferencesProfile");

if (preferencesProfile) {

    preferencesProfile.addEventListener("click", function () {

        window.location.href =
            "../profile/profile.html";

    });

}



    // Load preferences when page opens

    loadPreferences();

});