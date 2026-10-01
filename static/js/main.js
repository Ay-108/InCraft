/* =========================================
   InCraft — Main JavaScript
   static/js/main.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. SIDEBAR
       ========================================= */

    const sidebar =
        document.getElementById("sidebar");


    /*
     * The sidebar toggle itself is handled by
     * navbar.html.
     *
     * We only keep the sidebar reference here
     * for mobile behavior.
     */


    /* =========================================
       2. CLOSE SIDEBAR ON MOBILE
       ========================================= */

    if (sidebar) {

        sidebar.addEventListener(
            "click",
            function (event) {

                if (
                    window.innerWidth <= 768 &&
                    event.target.closest(".nav-item")
                ) {

                    document.body.classList.remove(
                        "sidebar-collapsed"
                    );

                    const sidebarToggle =
                        document.getElementById(
                            "sidebarToggle"
                        );

                    if (sidebarToggle) {

                        sidebarToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                }

            }
        );

    }


    /* =========================================
       3. GLOBAL ESCAPE HANDLER
       ========================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }


            /* Close modal */

            const modal =
                document.querySelector(
                    ".modal-overlay"
                );


            if (modal) {

                modal.style.display = "none";

            }


            /* Close dropdowns */

            const dropdowns =
                document.querySelectorAll(
                    ".notification-dropdown, .user-dropdown"
                );


            dropdowns.forEach(
                function (dropdown) {

                    dropdown.style.display =
                        "none";

                }
            );

        }
    );


    /* =========================================
       4. CONFIRM DELETE ACTIONS
       ========================================= */

    const deleteButtons =
        document.querySelectorAll(
            ".delete-btn, .delete-product-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this record?"
                        );


                    if (!confirmed) {

                        event.preventDefault();

                    }

                }
            );

        }
    );


    /* =========================================
       5. FLASH MESSAGE AUTO HIDE
       ========================================= */

    const flashMessages =
        document.querySelectorAll(
            ".flash-message, .alert"
        );


    flashMessages.forEach(
        function (message) {

            setTimeout(
                function () {

                    message.style.opacity = "0";

                    message.style.transition =
                        "opacity 0.3s ease";


                    setTimeout(
                        function () {

                            message.remove();

                        },
                        300
                    );

                },
                4000
            );

        }
    );


    /* =========================================
       6. FORM SUBMIT PROTECTION
       ========================================= */

    const forms =
        document.querySelectorAll(
            "form"
        );


    forms.forEach(
        function (form) {

            form.addEventListener(
                "submit",
                function () {

                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );


                    if (!submitButton) {
                        return;
                    }


                    /*
                     * Do not disable buttons that are
                     * intentionally used for client-side
                     * interactions.
                     */

                    if (
                        submitButton.dataset.noLoading ===
                        "true"
                    ) {

                        return;

                    }


                    submitButton.dataset.originalText =
                        submitButton.innerHTML;


                    submitButton.disabled = true;

                    submitButton.innerHTML =
                        "Processing...";

                }
            );

        }
    );


    /* =========================================
       7. GLOBAL SEARCH KEYBOARD SHORTCUT
       ========================================= */

    const globalSearch =
        document.getElementById(
            "globalSearch"
        );


    document.addEventListener(
        "keydown",
        function (event) {

            /*
             * "/" focuses global search.
             */

            if (
                event.key === "/" &&
                document.activeElement.tagName !== "INPUT" &&
                document.activeElement.tagName !== "TEXTAREA" &&
                document.activeElement.tagName !== "SELECT"
            ) {

                event.preventDefault();


                if (globalSearch) {

                    globalSearch.focus();

                }

            }

        }
    );


    /* =========================================
       8. CLEAR SEARCH WITH ESCAPE
       ========================================= */

    if (globalSearch) {

        globalSearch.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    globalSearch.value
                ) {

                    globalSearch.value = "";

                }

            }
        );

    }


    /* =========================================
       9. IMAGE PREVIEW
       ========================================= */

    const imageInputs =
        document.querySelectorAll(
            'input[type="file"][accept*="image"]'
        );


    imageInputs.forEach(
        function (input) {

            input.addEventListener(
                "change",
                function () {

                    const file =
                        input.files[0];


                    if (!file) {
                        return;
                    }


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        alert(
                            "Please select a valid image file."
                        );

                        input.value = "";

                        return;

                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        function (event) {

                            /*
                             * Look for a nearby preview.
                             */

                            const container =
                                input.closest(
                                    ".image-upload-area, .profile-photo-section"
                                );


                            if (!container) {
                                return;
                            }


                            const preview =
                                container.querySelector(
                                    ".image-preview, .profile-avatar"
                                );


                            if (!preview) {
                                return;
                            }


                            preview.innerHTML = `
                                <img
                                    src="${event.target.result}"
                                    alt="Image Preview"
                                >
                            `;

                        };


                    reader.readAsDataURL(file);

                }
            );

        }
    );


    /* =========================================
       10. NUMBER INPUT VALIDATION
       ========================================= */

    const numberInputs =
        document.querySelectorAll(
            'input[type="number"]'
        );


    numberInputs.forEach(
        function (input) {

            input.addEventListener(
                "input",
                function () {

                    const minimum =
                        input.getAttribute(
                            "min"
                        );


                    if (
                        minimum !== null &&
                        Number(input.value) <
                        Number(minimum)
                    ) {

                        input.value =
                            minimum;

                    }

                }
            );

        }
    );


    /* =========================================
       11. MOBILE TABLE SCROLL
       ========================================= */

    const tables =
        document.querySelectorAll(
            ".data-table"
        );


    tables.forEach(
        function (table) {

            table.setAttribute(
                "role",
                "table"
            );

        }
    );


    /* =========================================
       12. CURRENT YEAR
       ========================================= */

    const currentYear =
        document.querySelectorAll(
            ".current-year"
        );


    currentYear.forEach(
        function (element) {

            element.textContent =
                new Date().getFullYear();

        }
    );


    /* =========================================
       13. TOOLTIP SUPPORT
       ========================================= */

    const tooltipElements =
        document.querySelectorAll(
            "[data-tooltip]"
        );


    tooltipElements.forEach(
        function (element) {

            element.addEventListener(
                "mouseenter",
                function () {

                    element.setAttribute(
                        "title",
                        element.dataset.tooltip
                    );

                }
            );

        }
    );


    /* =========================================
       14. SMOOTH INTERNAL LINKS
       ========================================= */

    const internalLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    internalLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function (event) {

                    const targetId =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        targetId === "#" ||
                        !targetId
                    ) {

                        return;

                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        }
    );


    /* =========================================
       15. PAGE READY
       ========================================= */

    document.body.classList.add(
        "page-ready"
    );

});