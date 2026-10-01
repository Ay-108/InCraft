/* =========================================
   InCraft — Sales JavaScript
   static/js/sales.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. ELEMENTS
       ========================================= */

    const saleModal =
        document.getElementById("saleModal");

    const openSaleModalButton =
        document.getElementById("openSaleModal");

    const emptyRecordSaleButton =
        document.getElementById("emptyRecordSale");

    const closeSaleModalButton =
        document.getElementById("closeSaleModal");

    const cancelSaleButton =
        document.getElementById("cancelSale");

    const saleForm =
        document.getElementById("saleForm");

    const productSelect =
        document.getElementById("saleProduct");

    const quantityInput =
        document.getElementById("quantity");

    const priceInput =
        document.getElementById("unitPrice");

    const stockInfo =
        document.getElementById("stockInfo");

    const quantityPreview =
        document.getElementById("saleQuantityPreview");

    const unitPricePreview =
        document.getElementById("saleUnitPricePreview");

    const totalDisplay =
        document.getElementById("grandTotal");

    const saleFormMessage =
        document.getElementById("saleFormMessage");

    const salesSearch =
        document.getElementById("salesSearch");

    const paymentFilter =
        document.getElementById("paymentFilter");

    const dateFilter =
        document.getElementById("dateFilter");


    /* =========================================
       2. CURRENCY FORMAT
       ========================================= */

    function formatCurrency(value) {

        return "₹" +
            Number(value || 0).toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    /* =========================================
       3. FORM RESET
       ========================================= */

    function resetSaleForm() {

        if (!saleForm) {
            return;
        }

        saleForm.reset();

        if (priceInput) {
            priceInput.value = "0";
        }

        if (quantityInput) {
            quantityInput.value = "1";
            quantityInput.removeAttribute("max");
        }

        if (stockInfo) {
            stockInfo.textContent = "";
        }

        if (quantityPreview) {
            quantityPreview.textContent = "0";
        }

        if (unitPricePreview) {
            unitPricePreview.textContent =
                formatCurrency(0);
        }

        if (totalDisplay) {
            totalDisplay.textContent =
                formatCurrency(0);
        }

        hideSaleMessage();

    }


    /* =========================================
       4. OPEN MODAL
       ========================================= */

    function openSaleModal() {

        if (!saleModal) {
            return;
        }

        resetSaleForm();

        saleModal.hidden = false;

        /*
         * Clear inline display so the modal
         * can use the CSS display property.
         */
        saleModal.style.display = "";

        saleModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        if (productSelect) {
            productSelect.focus();
        }

    }


    /* =========================================
       5. CLOSE MODAL
       ========================================= */

    function closeSaleModal() {

        if (!saleModal) {
            return;
        }

        saleModal.hidden = true;

        /*
         * Force the modal to disappear.
         * This prevents CSS from overriding
         * the HTML hidden attribute.
         */
        saleModal.style.display = "none";

        saleModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        resetSaleForm();

    }


    /* =========================================
       6. OPEN BUTTON
       ========================================= */

    if (openSaleModalButton) {

        openSaleModalButton.addEventListener(
            "click",
            openSaleModal
        );

    }


    if (emptyRecordSaleButton) {

        emptyRecordSaleButton.addEventListener(
            "click",
            openSaleModal
        );

    }


    /* =========================================
       7. CLOSE BUTTON
       ========================================= */

    if (closeSaleModalButton) {

        closeSaleModalButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeSaleModal();

            }
        );

    }


    /* =========================================
       8. CANCEL BUTTON
       ========================================= */

    if (cancelSaleButton) {

        cancelSaleButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeSaleModal();

            }
        );

    }


    /* =========================================
       9. CLICK OUTSIDE MODAL
       ========================================= */

    if (saleModal) {

        saleModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === saleModal
                ) {

                    closeSaleModal();

                }

            }
        );

    }


    /* =========================================
       10. ESCAPE KEY
       ========================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                saleModal &&
                !saleModal.hidden
            ) {

                closeSaleModal();

            }

        }
    );


    /* =========================================
       11. MESSAGE
       ========================================= */

    function showSaleMessage(
        message,
        type = "error"
    ) {

        if (!saleFormMessage) {
            return;
        }

        saleFormMessage.textContent =
            message;

        saleFormMessage.hidden = false;

        saleFormMessage.classList.remove(
            "success",
            "error",
            "danger"
        );

        saleFormMessage.classList.add(
            type === "success"
                ? "success"
                : "error"
        );

    }


    function hideSaleMessage() {

        if (!saleFormMessage) {
            return;
        }

        saleFormMessage.hidden = true;

        saleFormMessage.textContent = "";

        saleFormMessage.classList.remove(
            "success",
            "error",
            "danger"
        );

    }


    /* =========================================
       12. PRODUCT DETAILS
       ========================================= */

    function updateProductDetails() {

        if (!productSelect) {
            return;
        }

        const selectedOption =
            productSelect.options[
                productSelect.selectedIndex
            ];


        if (
            !selectedOption ||
            !selectedOption.value
        ) {

            if (priceInput) {
                priceInput.value = "0";
            }

            if (quantityInput) {
                quantityInput.value = "1";
                quantityInput.removeAttribute("max");
            }

            if (stockInfo) {
                stockInfo.textContent = "";
            }

            calculateSale();

            return;

        }


        const price =
            Number(
                selectedOption.dataset.price || 0
            );


        const stock =
            Number(
                selectedOption.dataset.stock || 0
            );


        if (priceInput) {

            priceInput.value =
                price.toFixed(2);

        }


        if (quantityInput) {

            quantityInput.max =
                String(Math.max(stock, 0));


            if (stock > 0) {

                let quantity =
                    Number(quantityInput.value) || 1;


                if (quantity > stock) {
                    quantity = stock;
                }


                quantityInput.value =
                    String(quantity);

            }

        }


        if (stockInfo) {

            if (stock > 0) {

                stockInfo.textContent =
                    `Available stock: ${stock}`;

            } else {

                stockInfo.textContent =
                    "Out of stock";

            }

        }


        calculateSale();

    }


    if (productSelect) {

        productSelect.addEventListener(
            "change",
            function () {

                hideSaleMessage();

                updateProductDetails();

            }
        );

    }


    /* =========================================
       13. SALE CALCULATION
       ========================================= */

    function calculateSale() {

        const price =
            Number(
                priceInput
                    ? priceInput.value
                    : 0
            );


        const quantity =
            Number(
                quantityInput
                    ? quantityInput.value
                    : 0
            );


        const safePrice =
            Number.isFinite(price) &&
            price >= 0
                ? price
                : 0;


        const safeQuantity =
            Number.isFinite(quantity) &&
            quantity >= 0
                ? quantity
                : 0;


        const total =
            safePrice * safeQuantity;


        if (quantityPreview) {

            quantityPreview.textContent =
                String(safeQuantity);

        }


        if (unitPricePreview) {

            unitPricePreview.textContent =
                formatCurrency(safePrice);

        }


        if (totalDisplay) {

            totalDisplay.textContent =
                formatCurrency(total);

        }

    }


    /* =========================================
       14. QUANTITY
       ========================================= */

    if (quantityInput) {

        quantityInput.addEventListener(
            "input",
            function () {

                let quantity =
                    Number(quantityInput.value);


                const maximum =
                    Number(quantityInput.max);


                if (
                    !Number.isFinite(quantity) ||
                    quantity < 1
                ) {

                    quantity = 1;

                }


                if (
                    Number.isFinite(maximum) &&
                    maximum > 0 &&
                    quantity > maximum
                ) {

                    quantity = maximum;

                }


                quantityInput.value =
                    String(quantity);


                calculateSale();

            }
        );

    }


    /* =========================================
       15. SUBMIT SALE
       ========================================= */

    if (saleForm) {

        saleForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                hideSaleMessage();


                /* Product validation */

                if (
                    !productSelect ||
                    !productSelect.value
                ) {

                    showSaleMessage(
                        "Please select a product."
                    );

                    if (productSelect) {
                        productSelect.focus();
                    }

                    return;

                }


                /* Quantity validation */

                const quantity =
                    Number(
                        quantityInput
                            ? quantityInput.value
                            : 0
                    );


                const maximum =
                    Number(
                        quantityInput
                            ? quantityInput.max
                            : 0
                    );


                if (
                    !Number.isInteger(quantity) ||
                    quantity < 1
                ) {

                    showSaleMessage(
                        "Quantity must be at least 1."
                    );

                    quantityInput.focus();

                    return;

                }


                if (
                    Number.isFinite(maximum) &&
                    maximum > 0 &&
                    quantity > maximum
                ) {

                    showSaleMessage(
                        `Quantity cannot exceed available stock (${maximum}).`
                    );

                    quantityInput.focus();

                    return;

                }


                /* Out-of-stock validation */

                if (
                    Number.isFinite(maximum) &&
                    maximum === 0
                ) {

                    showSaleMessage(
                        "This product is out of stock."
                    );

                    if (productSelect) {
                        productSelect.focus();
                    }

                    return;

                }


                /* Confirmation */

                const confirmed =
                    window.confirm(
                        "Confirm this sale?"
                    );


                if (!confirmed) {
                    return;
                }


                const submitButton =
                    document.getElementById(
                        "completeSaleBtn"
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Saving...";

                }


                try {

                    const formData =
                        new FormData(
                            saleForm
                        );


                    const response =
                        await fetch(
                            saleForm.action,
                            {
                                method: "POST",
                                body: formData,
                                headers: {
                                    "X-Requested-With":
                                        "XMLHttpRequest"
                                }
                            }
                        );


                    let result;


                    try {

                        result =
                            await response.json();

                    } catch (error) {

                        throw new Error(
                            "The server returned an unexpected response."
                        );

                    }


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to record the sale."
                        );

                    }


                    showSaleMessage(
                        result.message ||
                        "Sale recorded successfully.",
                        "success"
                    );


                    setTimeout(
                        function () {

                            window.location.reload();

                        },
                        700
                    );


                } catch (error) {

                    showSaleMessage(
                        error.message ||
                        "Unable to record the sale."
                    );


                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Complete Sale";

                    }

                }

            }
        );

    }


    /* =========================================
       16. SALES SEARCH
       ========================================= */

    function filterSales() {

        const rows =
            document.querySelectorAll(
                "#salesTableBody .sales-row"
            );


        const searchQuery =
            salesSearch
                ? salesSearch.value
                    .trim()
                    .toLowerCase()
                : "";


        const payment =
            paymentFilter
                ? paymentFilter.value
                    .trim()
                    .toLowerCase()
                : "";


        const dateRange =
            dateFilter
                ? dateFilter.value
                : "";


        let visibleRows = 0;


        const today =
            new Date();


        rows.forEach(
            function (row) {

                const rowText =
                    row.textContent
                        .toLowerCase();


                const rowPayment =
                    (
                        row.dataset.payment ||
                        ""
                    ).toLowerCase();


                const searchMatch =
                    !searchQuery ||
                    rowText.includes(searchQuery);


                const paymentMatch =
                    !payment ||
                    rowPayment === payment;


                let dateMatch = true;


                const rowDateText =
                    row.dataset.date || "";


                if (
                    dateRange &&
                    rowDateText
                ) {

                    const rowDate =
                        new Date(rowDateText);


                    if (
                        !Number.isNaN(
                            rowDate.getTime()
                        )
                    ) {

                        const start =
                            new Date(today);


                        if (
                            dateRange === "today"
                        ) {

                            start.setHours(
                                0,
                                0,
                                0,
                                0
                            );

                            dateMatch =
                                rowDate >= start;

                        }


                        else if (
                            dateRange === "week"
                        ) {

                            start.setDate(
                                today.getDate() - 7
                            );

                            dateMatch =
                                rowDate >= start;

                        }


                        else if (
                            dateRange === "month"
                        ) {

                            start.setDate(1);

                            start.setHours(
                                0,
                                0,
                                0,
                                0
                            );

                            dateMatch =
                                rowDate >= start;

                        }

                    }

                }


                const visible =
                    searchMatch &&
                    paymentMatch &&
                    dateMatch;


                row.style.display =
                    visible
                        ? ""
                        : "none";


                if (visible) {
                    visibleRows++;
                }

            }
        );


        const noSalesResults =
            document.getElementById(
                "noSalesResults"
            );


        if (noSalesResults) {

            noSalesResults.style.display =
                visibleRows === 0 &&
                rows.length > 0
                    ? "table-row"
                    : "none";

        }


        const salesCount =
            document.getElementById(
                "salesCount"
            );


        if (salesCount) {

            salesCount.textContent =
                String(visibleRows);

        }

    }


    if (salesSearch) {

        salesSearch.addEventListener(
            "input",
            filterSales
        );

    }


    if (paymentFilter) {

        paymentFilter.addEventListener(
            "change",
            filterSales
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            filterSales
        );

    }


    /* =========================================
       17. VIEW SALE
       ========================================= */

    document
        .querySelectorAll(".view-sale-btn")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const invoice =
                            button.dataset.invoice;


                        if (invoice) {

                            alert(
                                `Invoice: ${invoice}\n\nDetailed sale view will be connected next.`
                            );

                        }

                    }
                );

            }
        );


    /* =========================================
       18. PRINT SALE
       ========================================= */

    document
        .querySelectorAll(".print-sale-btn")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        window.print();

                    }
                );

            }
        );


    /* =========================================
       19. INITIALIZATION
       ========================================= */

    updateProductDetails();

    calculateSale();

    filterSales();

});