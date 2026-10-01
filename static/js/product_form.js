/* =========================================
   InCraft — Product Form JavaScript
   static/js/product_form.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. ELEMENTS
       ========================================= */

    const form =
        document.getElementById("productForm");

    const imageInput =
        document.getElementById("productImage");

    const imagePreview =
        document.getElementById("imagePreview");

    const removeImage =
        document.getElementById("removeImage");

    const priceInput =
        document.getElementById("price");

    const quantityInput =
        document.getElementById("quantity");

    const reorderLevelInput =
        document.getElementById("reorderLevel");

    const taxInput =
        document.getElementById("tax");

    const subtotalDisplay =
        document.getElementById("subtotal");

    const taxDisplay =
        document.getElementById("taxAmount");

    const totalDisplay =
        document.getElementById("total");

    const resetButton =
        document.getElementById("resetProductForm");


    /* =========================================
       2. IMAGE PREVIEW
       ========================================= */

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            function () {

                const file =
                    imageInput.files[0];


                if (!file) {
                    return;
                }


                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please select a valid image file."
                    );

                    imageInput.value = "";

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        if (!imagePreview) {
                            return;
                        }


                        imagePreview.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="Product Preview"
                            >
                        `;

                    };


                reader.readAsDataURL(file);

            }
        );

    }


    /* =========================================
       3. REMOVE IMAGE
       ========================================= */

    if (removeImage) {

        removeImage.addEventListener(
            "click",
            function () {

                if (imageInput) {
                    imageInput.value = "";
                }


                if (imagePreview) {

                    imagePreview.innerHTML = `
                        <div class="image-placeholder">
                            +
                        </div>
                    `;

                }

            }
        );

    }


    /* =========================================
       4. CURRENCY FORMAT
       ========================================= */

    function formatCurrency(value) {

        return "₹" +
            Number(value || 0)
                .toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

    }


    /* =========================================
       5. CALCULATE TOTAL
       ========================================= */

    function calculateTotal() {

        const price =
            Number(
                priceInput
                    ? priceInput.value
                    : 0
            );


        const tax =
            Number(
                taxInput
                    ? taxInput.value
                    : 0
            );


        const safePrice =
            Number.isFinite(price) &&
            price >= 0
                ? price
                : 0;


        const safeTax =
            Number.isFinite(tax) &&
            tax >= 0
                ? tax
                : 0;


        const taxAmount =
            safePrice *
            safeTax /
            100;


        const total =
            safePrice +
            taxAmount;


        if (subtotalDisplay) {

            subtotalDisplay.textContent =
                formatCurrency(safePrice);

        }


        if (taxDisplay) {

            taxDisplay.textContent =
                formatCurrency(taxAmount);

        }


        if (totalDisplay) {

            totalDisplay.textContent =
                formatCurrency(total);

        }

    }


    /* =========================================
       6. PRICE / TAX EVENTS
       ========================================= */

    if (priceInput) {

        priceInput.addEventListener(
            "input",
            calculateTotal
        );

    }


    if (taxInput) {

        taxInput.addEventListener(
            "input",
            calculateTotal
        );

    }


    /* =========================================
       7. STOCK VALIDATION
       ========================================= */

    function validateStockInput(input) {

        if (!input) {
            return;
        }


        const value =
            Number(input.value);


        if (
            !Number.isFinite(value) ||
            value < 0
        ) {

            input.value = 0;

        }

    }


    if (quantityInput) {

        quantityInput.addEventListener(
            "input",
            function () {

                validateStockInput(
                    quantityInput
                );

            }
        );

    }


    if (reorderLevelInput) {

        reorderLevelInput.addEventListener(
            "input",
            function () {

                validateStockInput(
                    reorderLevelInput
                );

            }
        );

    }


    /* =========================================
       8. STOCK STATUS PREVIEW
       ========================================= */

    const stockStatus =
        document.getElementById(
            "stockStatus"
        );


    function updateStockStatus() {

        if (
            !quantityInput ||
            !stockStatus
        ) {
            return;
        }


        const quantity =
            Number(quantityInput.value || 0);


        const reorderLevel =
            Number(
                reorderLevelInput
                    ? reorderLevelInput.value
                    : 0
            );


        stockStatus.classList.remove(
            "in-stock",
            "low-stock",
            "out-of-stock"
        );


        if (quantity <= 0) {

            stockStatus.textContent =
                "Out of Stock";

            stockStatus.classList.add(
                "out-of-stock"
            );

        } else if (
            reorderLevel > 0 &&
            quantity <= reorderLevel
        ) {

            stockStatus.textContent =
                "Low Stock";

            stockStatus.classList.add(
                "low-stock"
            );

        } else {

            stockStatus.textContent =
                "In Stock";

            stockStatus.classList.add(
                "in-stock"
            );

        }

    }


    if (quantityInput) {

        quantityInput.addEventListener(
            "input",
            updateStockStatus
        );

    }


    if (reorderLevelInput) {

        reorderLevelInput.addEventListener(
            "input",
            updateStockStatus
        );

    }


    /* =========================================
       9. FORM VALIDATION
       ========================================= */

    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                let valid = true;


                const requiredFields =
                    form.querySelectorAll(
                        "[required]"
                    );


                requiredFields.forEach(
                    function (field) {

                        field.classList.remove(
                            "input-error"
                        );


                        if (
                            !field.value.trim()
                        ) {

                            field.classList.add(
                                "input-error"
                            );

                            valid = false;

                        }

                    }
                );


                /* Validate price */

                if (priceInput) {

                    const price =
                        Number(
                            priceInput.value
                        );


                    if (
                        !Number.isFinite(price) ||
                        price < 0
                    ) {

                        priceInput.classList.add(
                            "input-error"
                        );

                        valid = false;

                    }

                }


                /* Validate quantity */

                if (quantityInput) {

                    const quantity =
                        Number(
                            quantityInput.value
                        );


                    if (
                        !Number.isFinite(quantity) ||
                        quantity < 0
                    ) {

                        quantityInput.classList.add(
                            "input-error"
                        );

                        valid = false;

                    }

                }


                if (!valid) {

                    event.preventDefault();


                    const firstError =
                        form.querySelector(
                            ".input-error"
                        );


                    if (firstError) {

                        firstError.focus();

                    }


                    return;

                }

            }
        );

    }


    /* =========================================
       10. REMOVE ERROR WHEN USER TYPES
       ========================================= */

    if (form) {

        form.querySelectorAll(
            "input, select, textarea"
        ).forEach(
            function (field) {

                field.addEventListener(
                    "input",
                    function () {

                        field.classList.remove(
                            "input-error"
                        );

                    }
                );


                field.addEventListener(
                    "change",
                    function () {

                        field.classList.remove(
                            "input-error"
                        );

                    }
                );

            }
        );

    }


    /* =========================================
       11. RESET FORM
       ========================================= */

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                if (!form) {
                    return;
                }


                const confirmed =
                    confirm(
                        "Reset all product form fields?"
                    );


                if (!confirmed) {
                    return;
                }


                form.reset();


                if (imagePreview) {

                    imagePreview.innerHTML = `
                        <div class="image-placeholder">
                            +
                        </div>
                    `;

                }


                if (stockStatus) {

                    stockStatus.textContent =
                        "In Stock";

                    stockStatus.classList.remove(
                        "low-stock",
                        "out-of-stock"
                    );

                    stockStatus.classList.add(
                        "in-stock"
                    );

                }


                calculateTotal();

            }
        );

    }


    /* =========================================
       12. INITIAL CALCULATIONS
       ========================================= */

    calculateTotal();

    updateStockStatus();

});