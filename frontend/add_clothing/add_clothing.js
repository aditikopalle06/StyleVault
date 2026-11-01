// add_clothing.js

document.addEventListener("DOMContentLoaded", function () {

    // --------------------------------
    // LOGIN INFORMATION
    // --------------------------------

    const storedUser =
        localStorage.getItem("user");

    const token =
        localStorage.getItem("token");


    // --------------------------------
    // CHECK EDIT MODE
    // --------------------------------

    const urlParams =
        new URLSearchParams(window.location.search);

    const editItemId =
        urlParams.get("item_id");

    const isEditMode =
        !!editItemId;


    // --------------------------------
    // PAGE ELEMENTS
    // --------------------------------

    const displayNameElement =
        document.getElementById("displayName");

    const addClothingForm =
        document.getElementById("addClothingForm");

    const clothingImage =
        document.getElementById("clothingImage");

    const imagePreview =
        document.getElementById("imagePreview");

    const imageUploadContent =
        document.getElementById("imageUploadContent");

    const cancelButton =
        document.getElementById("cancelButton");

    const saveClothingButton =
        document.getElementById("saveClothingButton");


    // --------------------------------
    // DISPLAY USER NAME
    // --------------------------------

    if (storedUser) {

        try {

            const user =
                JSON.parse(storedUser);

            const name =
                user.name ||
                user.username ||
                "User";

            if (displayNameElement) {

                displayNameElement.textContent =
                    name;

            }

        } catch (error) {

            console.error(
                "Unable to read user information:",
                error
            );

        }

    }


    // --------------------------------
    // PAGE TITLE
    // --------------------------------

    const pageTitle =
        document.querySelector("main h1");

    const pageDescription =
        document.querySelector(
            "main h1 + p"
        );


    if (isEditMode) {

        if (pageTitle) {

            pageTitle.textContent =
                "Edit Clothing";

        }

        if (pageDescription) {

            pageDescription.textContent =
                "Update the details of your clothing item.";

        }

        if (saveClothingButton) {

            saveClothingButton.innerHTML = `

                <span class="material-symbols-outlined">
                    check
                </span>

                Save Changes

            `;

        }

    }


    // --------------------------------
    // IMAGE DATA
    // --------------------------------

    let imageData = null;
    let isBackgroundProcessing = false;
    let imageChoiceMade = false;


    // --------------------------------
    // LOAD EXISTING CLOTHING
    // --------------------------------

    async function loadExistingClothing() {

        if (!isEditMode) {

            return;

        }


        if (!token) {

            alert(
                "Please login again."
            );

            window.location.href =
                "../login/login.html";

            return;

        }


        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/clothing/${editItemId}`,
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


            // --------------------------------
            // SESSION ERROR
            // --------------------------------

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                alert(
                    "Your session has expired. Please login again."
                );

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                window.location.href =
                    "../login/login.html";

                return;

            }


            // --------------------------------
            // ITEM NOT FOUND
            // --------------------------------

            if (!response.ok) {

                alert(
                    data.error ||
                    "Unable to load clothing item."
                );

                window.location.href =
                    "../wardrobe/wardrobe.html";

                return;

            }


            const item =
                data.item;


            // --------------------------------
            // FILL FORM
            // --------------------------------

            const nameInput =
                document.getElementById(
                    "garment-name"
                );

            const categoryInput =
                document.getElementById(
                    "category"
                );

            const colourInput =
                document.getElementById(
                    "color"
                );

            const seasonInput =
                document.getElementById(
                    "season"
                );

            const priceInput =
                document.getElementById(
                    "price"
                );

            const sizeInput =
                document.getElementById(
                    "size"
                );

            const occasionInput =
                document.getElementById(
                    "occasion"
                );

            const notesInput =
                document.getElementById(
                    "notes"
                );


            if (nameInput) {

                nameInput.value =
                    item.name || "";

            }


            if (categoryInput) {

                categoryInput.value =
                    item.category || "";

            }


            if (colourInput) {

                colourInput.value =
                    item.colour || "";

            }


            if (seasonInput) {

                seasonInput.value =
                    item.season || "";

            }


            if (priceInput) {

                priceInput.value =
                    item.price ?? "";

            }


            if (sizeInput) {

                sizeInput.value =
                    item.size || "";

            }


            if (occasionInput) {

                occasionInput.value =
                    item.occasion || "";

            }


            if (notesInput) {

                notesInput.value =
                    item.extra_info || "";

            }


            // --------------------------------
            // EXISTING IMAGE
            // --------------------------------

            if (item.image) {

                imageData =
                    item.image;


                if (imagePreview) {

                    imagePreview.src =
                        item.image;

                    imagePreview.classList.remove(
                        "hidden"
                    );

                }


                if (imageUploadContent) {

                    imageUploadContent.classList.add(
                        "hidden"
                    );

                }

            }


        } catch (error) {

            console.error(
                "Error loading clothing item:",
                error
            );

            alert(
                "Something went wrong while loading the clothing item."
            );

            window.location.href =
                "../wardrobe/wardrobe.html";

        }

    }

    // --------------------------------
    // IMAGE PREVIEW + CROPPING + BACKGROUND REMOVAL
    // --------------------------------

    let originalImageData = null;
    let processedImageData = null;

    let cropper = null;
    let pendingImageFile = null;

    const cropModal = document.getElementById("cropModal");
    const cropImage = document.getElementById("cropImage");

    const applyCropButton =
        document.getElementById("applyCropButton");

    const cancelCropButton =
        document.getElementById("cancelCropButton");

    const cancelCropFooterButton =
        document.getElementById("cancelCropFooterButton");

    const zoomInButton =
        document.getElementById("zoomInButton");

    const zoomOutButton =
        document.getElementById("zoomOutButton");

    let imageStatus = document.createElement("p");
    imageStatus.className = "text-sm text-center mt-3";
    imageStatus.setAttribute("role", "status");

    let imageActions = document.createElement("div");
    imageActions.className =
        "flex flex-wrap justify-center gap-3 mt-3";

    const imageUploadArea =
        document.getElementById("imageUploadArea");

    if (imageUploadArea) {
        imageUploadArea.insertAdjacentElement(
            "afterend",
            imageStatus
        );

        imageStatus.insertAdjacentElement(
            "afterend",
            imageActions
        );
    }

    function showImage(dataUrl) {
        if (imagePreview) {
            imagePreview.src = dataUrl;
            imagePreview.classList.remove("hidden");
        }

        if (imageUploadContent) {
            imageUploadContent.classList.add("hidden");
        }
    }

    function clearImageActions() {
        imageActions.replaceChildren();
    }

    function addImageButton(label, onClick, primary = false) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = label;

        button.className = primary
            ? "px-5 py-2 rounded-xl bg-[#8b9a7d] text-white hover:bg-[#748567]"
            : "px-5 py-2 rounded-xl border border-[#d6d0cc] bg-white hover:bg-[#f5f1ee]";

        button.addEventListener("click", onClick);
        imageActions.appendChild(button);

        return button;
    }

    function closeCropModal() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        if (cropModal) {
            cropModal.classList.remove("is-open");
            cropModal.setAttribute("aria-hidden", "true");
        }

        if (cropImage) {
            cropImage.src = "";
        }
    }

    function openCropModal(imageDataUrl) {
        if (!cropModal || !cropImage) {
            alert("Crop modal elements could not be found.");
            return;
        }

        cropImage.onload = function () {
            if (cropper) {
                cropper.destroy();
            }

            cropper = new Cropper(cropImage, {
                viewMode: 1,
                dragMode: "move",
                autoCropArea: 0.85,
                responsive: true,
                background: false,
                guides: true,
                center: true,
                movable: true,
                zoomable: true,
                zoomOnWheel: true,
                rotatable: false,
                scalable: false,
                aspectRatio: NaN
            });
        };

        cropImage.src = imageDataUrl;

        cropModal.classList.add("is-open");
        cropModal.setAttribute("aria-hidden", "false");
    }

    function cancelCropping() {
        closeCropModal();

        pendingImageFile = null;

        if (clothingImage) {
            clothingImage.value = "";
        }

        isBackgroundProcessing = false;
        imageChoiceMade = true;

        if (saveClothingButton) {
            saveClothingButton.disabled = false;
        }

        imageStatus.textContent =
            "Image selection cancelled.";
    }

    if (cancelCropButton) {
        cancelCropButton.addEventListener(
            "click",
            cancelCropping
        );
    }

    if (cancelCropFooterButton) {
        cancelCropFooterButton.addEventListener(
            "click",
            cancelCropping
        );
    }

    if (zoomInButton) {
        zoomInButton.addEventListener("click", function () {
            if (cropper) {
                cropper.zoom(0.1);
            }
        });
    }

    if (zoomOutButton) {
        zoomOutButton.addEventListener("click", function () {
            if (cropper) {
                cropper.zoom(-0.1);
            }
        });
    }

    // --------------------------------
    // APPLY CROP
    // --------------------------------

    if (applyCropButton) {
        applyCropButton.addEventListener(
            "click",
            function () {
                if (!cropper) {
                    alert("Please select an image to crop.");
                    return;
                }

                const croppedCanvas =
                    cropper.getCroppedCanvas({
                        maxWidth: 2000,
                        maxHeight: 2000,
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: "high"
                    });

                if (!croppedCanvas) {
                    alert("Unable to crop this image.");
                    return;
                }

                croppedCanvas.toBlob(
                    async function (blob) {
                        if (!blob) {
                            alert("Unable to create cropped image.");
                            return;
                        }

                        const croppedFile = new File(
                            [blob],
                            "cropped-clothing.png",
                            {
                                type: "image/png"
                            }
                        );

                        closeCropModal();

                        await processImageForBackgroundRemoval(
                            croppedFile
                        );
                    },
                    "image/png"
                );
            }
        );
    }

    // --------------------------------
    // PROCESS CROPPED IMAGE
    // --------------------------------

    async function processImageForBackgroundRemoval(file) {
        isBackgroundProcessing = true;
        imageChoiceMade = false;

        if (saveClothingButton) {
            saveClothingButton.disabled = true;
        }

        clearImageActions();

        imageStatus.textContent =
            "Loading your cropped image...";

        processedImageData = null;

        try {
            originalImageData = await new Promise(
                function (resolve, reject) {
                    const reader = new FileReader();

                    reader.onload = function () {
                        resolve(reader.result);
                    };

                    reader.onerror = function () {
                        reject(
                            new Error("Unable to read this image.")
                        );
                    };

                    reader.readAsDataURL(file);
                }
            );

            // Keep the cropped original as the safe default.
            imageData = originalImageData;
            showImage(originalImageData);

            imageStatus.textContent =
                "Removing the background... This may take a little while.";

            if (!token) {
                throw new Error(
                    "Please log in to remove the background."
                );
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                "http://localhost:5000/api/clothing/remove-background",
                {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + token
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                let message = "Background removal failed.";

                try {
                    const errorData = JSON.parse(errorText);
                    message = errorData.error || message;
                } catch (_) {
                    if (errorText) {
                        message = errorText;
                    }
                }

                throw new Error(message);
            }

            const resultBlob = await response.blob();

            if (!resultBlob.type.includes("image/png")) {
                throw new Error(
                    "The server did not return a PNG image."
                );
            }

            processedImageData = await new Promise(
                function (resolve, reject) {
                    const reader = new FileReader();

                    reader.onload = function () {
                        resolve(reader.result);
                    };

                    reader.onerror = function () {
                        reject(
                            new Error(
                                "Unable to preview the processed image."
                            )
                        );
                    };

                    reader.readAsDataURL(resultBlob);
                }
            );

            showImage(processedImageData);

            imageStatus.textContent =
                "Background removed! Choose which image to use.";

            // Use the background-removed image.
            addImageButton(
                "Use This Image",
                function () {
                    imageData = processedImageData;
                    imageChoiceMade = true;
                    isBackgroundProcessing = false;

                    if (saveClothingButton) {
                        saveClothingButton.disabled = false;
                    }

                    showImage(processedImageData);

                    imageStatus.textContent =
                        "Background-removed image selected.";

                    clearImageActions();
                },
                true
            );

            // Keep the cropped image with its background.
            addImageButton(
                "Keep Original",
                function () {
                    imageData = originalImageData;
                    imageChoiceMade = true;
                    isBackgroundProcessing = false;

                    if (saveClothingButton) {
                        saveClothingButton.disabled = false;
                    }

                    showImage(originalImageData);

                    imageStatus.textContent =
                        "Cropped original image selected.";

                    clearImageActions();
                }
            );

        } catch (error) {
            console.error(
                "Background removal failed:",
                error
            );

            imageData = originalImageData;

            if (originalImageData) {
                showImage(originalImageData);
            }

            imageStatus.textContent =
                "Couldn't remove the background. Your cropped original is kept.";

            clearImageActions();

            addImageButton(
                "Keep Original",
                function () {
                    imageData = originalImageData;
                    imageChoiceMade = true;
                    isBackgroundProcessing = false;

                    if (saveClothingButton) {
                        saveClothingButton.disabled = false;
                    }

                    showImage(originalImageData);

                    imageStatus.textContent =
                        "Cropped original image selected.";

                    clearImageActions();
                }
            );

            if (
                error.message.includes("401") ||
                error.message.includes("403")
            ) {
                imageStatus.textContent =
                    "Your session may have expired. Please log in again.";
            }

        } finally {
            pendingImageFile = null;
        }
    }

    // --------------------------------
    // IMAGE UPLOAD — OPEN CROP MODAL
    // --------------------------------

    if (clothingImage) {
        clothingImage.addEventListener(
            "change",
            async function () {
                const file = clothingImage.files[0];

                if (!file) {
                    return;
                }

                if (!file.type.startsWith("image/")) {
                    alert("Please select an image file.");
                    clothingImage.value = "";
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    alert(
                        "Please choose an image smaller than 10 MB."
                    );

                    clothingImage.value = "";
                    return;
                }

                pendingImageFile = file;

                imageStatus.textContent =
                    "Preparing image for cropping...";

                try {
                    const imageDataUrl = await new Promise(
                        function (resolve, reject) {
                            const reader = new FileReader();

                            reader.onload = function () {
                                resolve(reader.result);
                            };

                            reader.onerror = function () {
                                reject(
                                    new Error(
                                        "Unable to read this image."
                                    )
                                );
                            };

                            reader.readAsDataURL(file);
                        }
                    );

                    openCropModal(imageDataUrl);

                    imageStatus.textContent =
                        "Adjust the crop around your clothing, then click Apply Crop.";

                } catch (error) {
                    console.error(
                        "Image loading failed:",
                        error
                    );

                    alert(
                        "Unable to load this image. Please try another one."
                    );

                    clothingImage.value = "";
                    pendingImageFile = null;
                }
            }
        );
    }


    // --------------------------------
    // CANCEL BUTTON
    // --------------------------------

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                if (isEditMode) {

                    window.location.href =
                        `../clothing_details/clothing_details.html?item_id=${editItemId}`;

                } else {

                    window.location.href =
                        "../wardrobe/wardrobe.html";

                }

            }
        );

    }


    // --------------------------------
    // SUBMIT FORM
    // --------------------------------

    if (addClothingForm) {

        addClothingForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                if (isBackgroundProcessing) {
                    alert("Please wait for background removal to finish.");
                    return;
                }

                if (clothingImage.files.length > 0 && !imageChoiceMade) {
                    alert("Please choose the processed image or keep the original before saving.");
                    return;
                }


                // --------------------------------
                // CHECK LOGIN
                // --------------------------------

                if (!token) {

                    alert(
                        "Please log in before saving clothing."
                    );

                    window.location.href =
                        "../login/login.html";

                    return;

                }


                // --------------------------------
                // GET FORM VALUES
                // --------------------------------

                const name =
                    document
                        .getElementById(
                            "garment-name"
                        )
                        .value
                        .trim();


                const category =
                    document
                        .getElementById(
                            "category"
                        )
                        .value;


                const colour =
                    document
                        .getElementById(
                            "color"
                        )
                        .value;


                const season =
                    document
                        .getElementById(
                            "season"
                        )
                        .value;


                const price =
                    document
                        .getElementById(
                            "price"
                        )
                        .value;


                const size =
                    document
                        .getElementById(
                            "size"
                        )
                        .value
                        .trim();


                const occasion =
                    document
                        .getElementById(
                            "occasion"
                        )
                        .value;


                const extraInfo =
                    document
                        .getElementById(
                            "notes"
                        )
                        .value
                        .trim();


                // --------------------------------
                // VALIDATION
                // --------------------------------

                if (
                    !name ||
                    !category ||
                    !colour
                ) {

                    alert(
                        "Please enter the garment name, category and colour."
                    );

                    return;

                }


                // --------------------------------
                // DISABLE BUTTON
                // --------------------------------

                if (saveClothingButton) {

                    saveClothingButton.disabled =
                        true;


                    saveClothingButton.innerHTML = `

                        <span class="material-symbols-outlined">
                            progress_activity
                        </span>

                        ${
                            isEditMode
                                ? "Saving..."
                                : "Adding..."
                        }

                    `;

                }


                try {

                    // --------------------------------
                    // PREPARE DATA
                    // --------------------------------

                    const clothingData = {

                        name:
                            name,

                        category:
                            category,

                        colour:
                            colour,

                        season:
                            season || null,

                        price:
                            price
                                ? Number(price)
                                : null,

                        image:
                            imageData || null,

                        size:
                            size || null,

                        occasion:
                            occasion || null,

                        extra_info:
                            extraInfo || null

                    };


                    // --------------------------------
                    // CHOOSE METHOD
                    // --------------------------------

                    const url =
                        isEditMode

                            ? `http://localhost:5000/api/clothing/${editItemId}`

                            : "http://localhost:5000/api/clothing";


                    const method =
                        isEditMode
                            ? "PUT"
                            : "POST";


                    // --------------------------------
                    // SEND TO BACKEND
                    // --------------------------------

                    const response =
                        await fetch(
                            url,
                            {
                                method:
                                    method,

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        "Bearer " + token

                                },

                                body:
                                    JSON.stringify(
                                        clothingData
                                    )

                            }
                        );


                    const data =
                        await response.json();


                    // --------------------------------
                    // SESSION ERROR
                    // --------------------------------

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

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

                        return;

                    }


                    // --------------------------------
                    // BACKEND ERROR
                    // --------------------------------

                    if (!response.ok) {

                        console.error(
                            data.error ||
                            "Unable to save clothing."
                        );

                        alert(
                            data.error ||
                            "Unable to save clothing."
                        );

                        return;

                    }


                    // --------------------------------
                    // SUCCESS
                    // --------------------------------

                    console.log(
                        isEditMode
                            ? "Clothing item updated:"
                            : "Clothing item created:",
                        data.item
                    );


                    if (isEditMode) {

                        alert(
                            "Clothing item updated successfully!"
                        );


                        window.location.href =
                            `../clothing_details/clothing_details.html?item_id=${editItemId}`;

                    } else {

                        alert(
                            "Clothing item added successfully!"
                        );


                        window.location.href =
                            "../wardrobe/wardrobe.html";

                    }


                } catch (error) {

                    console.error(
                        isEditMode
                            ? "Error updating clothing:"
                            : "Error adding clothing:",
                        error
                    );


                    alert(
                        isEditMode
                            ? "Something went wrong while updating the clothing item."
                            : "Something went wrong while adding the clothing item."
                    );


                } finally {

                    // --------------------------------
                    // ENABLE BUTTON AGAIN
                    // --------------------------------

                    if (saveClothingButton) {

                        saveClothingButton.disabled =
                            isBackgroundProcessing ||
                            (clothingImage.files.length > 0 && !imageChoiceMade);

                        saveClothingButton.innerHTML = `

                            <span class="material-symbols-outlined">
                                check
                            </span>

                            ${
                                isEditMode
                                    ? "Save Changes"
                                    : "Save to Wardrobe"
                            }

                        `;

                    }

                }

            }
        );

    }


    // --------------------------------
    // LOAD EXISTING ITEM IF EDITING
    // --------------------------------

    loadExistingClothing();

});