/* =========================================
   InCraft — Inventory JavaScript
   static/js/inventory.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. ELEMENTS
       ========================================= */

    const searchInput =
        document.getElementById("inventorySearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const stockFilter =
        document.getElementById("stockFilter");

    const sortFilter =
        document.getElementById("sortFilter");

    const selectAll =
        document.getElementById("selectAllProducts");

    const productRows =
        document.querySelectorAll(".inventory-row");

    const productCheckboxes =
        document.querySelectorAll(".product-checkbox");

    const deleteSelectedBtn =
        document.getElementById("deleteSelectedBtn");

    const importInventoryBtn =
        document.getElementById("importInventoryBtn");

    const inventoryFile =
        document.getElementById("inventoryFile");

    const printInventoryBtn =
        document.getElementById("printInventoryBtn");

    const shareInventoryBtn =
        document.getElementById("shareInventoryBtn");

    const previousPageBtn =
        document.getElementById("previousPageBtn");

    const nextPageBtn =
        document.getElementById("nextPageBtn");


    /* =========================================
       2. DELETE MODAL ELEMENTS
       ========================================= */

    const deleteModal =
        document.getElementById("deleteModal");

    const closeDeleteModal =
        document.getElementById("closeDeleteModal");

    const cancelDeleteBtn =
        document.getElementById("cancelDeleteBtn");

    const confirmDeleteBtn =
        document.getElementById("confirmDeleteBtn");

    const deleteProductName =
        document.getElementById("deleteProductName");

    let selectedDeleteProductId = null;


    /* =========================================
       3. FILTER INVENTORY
       ========================================= */

    function filterInventory() {

        const search =
            searchInput
                ? searchInput.value.trim().toLowerCase()
                : "";

        const category =
            categoryFilter
                ? categoryFilter.value.trim().toLowerCase()
                : "";

        const stock =
            stockFilter
                ? stockFilter.value.trim().toLowerCase()
                : "";


        productRows.forEach(function (row) {

            const rowText =
                row.textContent.toLowerCase();

            const rowCategory =
                (row.dataset.category || "")
                    .toLowerCase();

            const quantity =
                Number(row.dataset.stock || 0);


            /* Search */

            const matchesSearch =
                !search ||
                rowText.includes(search);


            /* Category */

            const matchesCategory =
                !category ||
                rowCategory === category;


            /* Stock */

            let matchesStock = true;

            if (stock === "in-stock") {

                matchesStock =
                    quantity > 10;

            } else if (stock === "low-stock") {

                matchesStock =
                    quantity > 0 &&
                    quantity <= 10;

            } else if (stock === "out-of-stock") {

                matchesStock =
                    quantity <= 0;

            }


            const visible =
                matchesSearch &&
                matchesCategory &&
                matchesStock;


            row.style.display =
                visible ? "" : "none";

        });


        updateSelectAllState();
        updateDeleteSelectedButton();
    }


    /* =========================================
       4. SEARCH
       ========================================= */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterInventory
        );

    }


    /* =========================================
       5. CATEGORY FILTER
       ========================================= */

    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            filterInventory
        );

    }


    /* =========================================
       6. STOCK FILTER
       ========================================= */

    if (stockFilter) {

        stockFilter.addEventListener(
            "change",
            filterInventory
        );

    }


    /* =========================================
       7. SORT INVENTORY
       ========================================= */

    function sortInventory() {

        if (!sortFilter) {
            return;
        }

        const sortValue =
            sortFilter.value;

        const tableBody =
            document.getElementById(
                "inventoryTableBody"
            );

        if (!tableBody) {
            return;
        }


        const rows =
            Array.from(
                tableBody.querySelectorAll(
                    ".inventory-row"
                )
            );


        rows.sort(function (a, b) {

            const nameA =
                (a.dataset.name || "")
                    .toLowerCase();

            const nameB =
                (b.dataset.name || "")
                    .toLowerCase();

            const stockA =
                Number(a.dataset.stock || 0);

            const stockB =
                Number(b.dataset.stock || 0);

            const priceA =
                Number(a.dataset.price || 0);

            const priceB =
                Number(b.dataset.price || 0);

            const createdA =
                new Date(
                    a.dataset.created || 0
                );

            const createdB =
                new Date(
                    b.dataset.created || 0
                );


            switch (sortValue) {

                case "oldest":
                    return createdA - createdB;

                case "name-asc":
                    return nameA.localeCompare(nameB);

                case "name-desc":
                    return nameB.localeCompare(nameA);

                case "stock-low":
                    return stockA - stockB;

                case "stock-high":
                    return stockB - stockA;

                case "price-low":
                    return priceA - priceB;

                case "price-high":
                    return priceB - priceA;

                case "newest":
                default:
                    return createdB - createdA;
            }

        });


        rows.forEach(function (row) {

            tableBody.appendChild(row);

        });


        updateSelectAllState();
    }


    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            sortInventory
        );

    }


    /* =========================================
       8. SELECT ALL PRODUCTS
       ========================================= */

    if (selectAll) {

        selectAll.addEventListener(
            "change",
            function () {

                productRows.forEach(
                    function (row) {

                        if (
                            row.style.display ===
                            "none"
                        ) {
                            return;
                        }


                        const checkbox =
                            row.querySelector(
                                ".product-checkbox"
                            );


                        if (checkbox) {

                            checkbox.checked =
                                selectAll.checked;

                        }

                    }
                );


                updateSelectAllState();
                updateDeleteSelectedButton();

            }
        );

    }


    /* =========================================
       9. INDIVIDUAL CHECKBOXES
       ========================================= */

    productCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    updateSelectAllState();
                    updateDeleteSelectedButton();

                }
            );

        }
    );


    /* =========================================
       10. UPDATE SELECT ALL STATE
       ========================================= */

    function updateSelectAllState() {

        if (!selectAll) {
            return;
        }


        const visibleCheckboxes = [];


        productRows.forEach(
            function (row) {

                if (
                    row.style.display !==
                    "none"
                ) {

                    const checkbox =
                        row.querySelector(
                            ".product-checkbox"
                        );


                    if (checkbox) {

                        visibleCheckboxes.push(
                            checkbox
                        );

                    }

                }

            }
        );


        if (!visibleCheckboxes.length) {

            selectAll.checked = false;
            selectAll.indeterminate = false;

            return;

        }


        const checkedCount =
            visibleCheckboxes.filter(
                function (checkbox) {
                    return checkbox.checked;
                }
            ).length;


        selectAll.checked =
            checkedCount ===
            visibleCheckboxes.length;


        selectAll.indeterminate =
            checkedCount > 0 &&
            checkedCount <
            visibleCheckboxes.length;

    }


    /* =========================================
       11. UPDATE DELETE SELECTED BUTTON
       ========================================= */

    function updateDeleteSelectedButton() {

        if (!deleteSelectedBtn) {
            return;
        }


        const selected =
            document.querySelectorAll(
                ".product-checkbox:checked"
            );


        deleteSelectedBtn.disabled =
            selected.length === 0;

    }


    /* =========================================
       12. OPEN DELETE MODAL
       ========================================= */

    function openDeleteModal(
        productId,
        productName
    ) {

        if (!deleteModal) {
            return;
        }


        selectedDeleteProductId =
            productId;


        if (deleteProductName) {

            deleteProductName.textContent =
                productName ||
                "this product";

        }


        deleteModal.hidden = false;

    }


    /* =========================================
       13. CLOSE DELETE MODAL
       ========================================= */

    function closeDeleteProductModal() {

        if (!deleteModal) {
            return;
        }


        deleteModal.hidden = true;

        selectedDeleteProductId = null;

    }


    /* =========================================
       14. DELETE BUTTONS
       ========================================= */

    const deleteButtons =
        document.querySelectorAll(
            ".delete-product-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const productId =
                        button.dataset.productId;

                    const productName =
                        button.dataset.productName ||
                        "this product";


                    /*
                     * IMPORTANT:
                     * No browser confirm() here.
                     *
                     * The custom InCraft modal
                     * is used instead.
                     */

                    openDeleteModal(
                        productId,
                        productName
                    );

                }
            );

        }
    );


    /* =========================================
       15. CLOSE DELETE MODAL
       ========================================= */

    if (closeDeleteModal) {

        closeDeleteModal.addEventListener(
            "click",
            closeDeleteProductModal
        );

    }


    if (cancelDeleteBtn) {

        cancelDeleteBtn.addEventListener(
            "click",
            closeDeleteProductModal
        );

    }


    /* =========================================
       16. CLOSE MODAL BY CLICKING OUTSIDE
       ========================================= */

    if (deleteModal) {

        deleteModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    deleteModal
                ) {

                    closeDeleteProductModal();

                }

            }
        );

    }


    /* =========================================
       17. ESCAPE KEY CLOSES MODAL
       ========================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                deleteModal &&
                !deleteModal.hidden
            ) {

                closeDeleteProductModal();

            }

        }
    );


    /* =========================================
       18. CONFIRM DELETE
       ========================================= */

    if (confirmDeleteBtn) {

        confirmDeleteBtn.addEventListener(
            "click",
            async function () {

                if (!selectedDeleteProductId) {
                    return;
                }


                const productId =
                    selectedDeleteProductId;


                confirmDeleteBtn.disabled = true;

                confirmDeleteBtn.textContent =
                    "Deleting...";


                try {

                    const response =
                        await fetch(
                            `/inventory/delete/${productId}`,
                            {
                                method: "POST",
                                headers: {
                                    "X-Requested-With":
                                        "XMLHttpRequest"
                                }
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok ||
                        !data.success) {

                        throw new Error(
                            data.message ||
                            "Unable to delete product."
                        );

                    }


                    /*
                     * Product has been archived
                     * successfully by Flask.
                     */

                    closeDeleteProductModal();


                    /*
                     * Reload Inventory so the
                     * archived product disappears.
                     */

                    window.location.reload();

                } catch (error) {

                    console.error(
                        "Delete error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to delete product."
                    );


                    confirmDeleteBtn.disabled =
                        false;

                    confirmDeleteBtn.textContent =
                        "Delete";

                }

            }
        );

    }


    /* =========================================
       19. DELETE SELECTED
       ========================================= */

    if (deleteSelectedBtn) {

        deleteSelectedBtn.addEventListener(
            "click",
            function () {

                const selected =
                    document.querySelectorAll(
                        ".product-checkbox:checked"
                    );


                if (!selected.length) {
                    return;
                }


                /*
                 * Bulk deletion is not connected
                 * yet. We will implement it after
                 * individual deletion is verified.
                 */

                alert(
                    "Bulk delete will be connected after individual delete is tested."
                );

            }
        );

    }


    /* =========================================
       20. IMPORT INVENTORY
       ========================================= */

    if (importInventoryBtn &&
        inventoryFile) {

        importInventoryBtn.addEventListener(
            "click",
            function () {

                inventoryFile.click();

            }
        );

    }


    if (inventoryFile) {

        inventoryFile.addEventListener(
            "change",
            function () {

                if (
                    inventoryFile.files &&
                    inventoryFile.files.length > 0
                ) {

                    const form =
                        document.getElementById(
                            "inventoryImportForm"
                        );


                    if (form) {

                        form.submit();

                    }

                }

            }
        );

    }


    /* =========================================
       21. PRINT INVENTORY
       ========================================= */

    if (printInventoryBtn) {

        printInventoryBtn.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }


    /* =========================================
       22. SHARE INVENTORY
       ========================================= */

    if (shareInventoryBtn) {

        shareInventoryBtn.addEventListener(
            "click",
            async function () {

                const shareData = {
                    title: "InCraft Inventory",
                    text: "Inventory information from InCraft.",
                    url: window.location.href
                };


                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share(
                            shareData
                        );

                    } else if (
                        navigator.clipboard
                    ) {

                        await navigator.clipboard.writeText(
                            window.location.href
                        );


                        alert(
                            "Inventory link copied to clipboard."
                        );

                    } else {

                        alert(
                            "Sharing is not supported in this browser."
                        );

                    }

                } catch (error) {

                    /*
                     * User cancelled the native
                     * share dialog.
                     * No error message is needed.
                     */

                    console.log(
                        "Share cancelled."
                    );

                }

            }
        );

    }


    /* =========================================
       23. PAGINATION
       ========================================= */

    if (previousPageBtn) {

        previousPageBtn.disabled = true;

    }


    if (nextPageBtn) {

        nextPageBtn.disabled = true;

    }


    /* =========================================
       24. INITIAL STATE
       ========================================= */

    filterInventory();

    sortInventory();

    updateSelectAllState();

    updateDeleteSelectedButton();

});