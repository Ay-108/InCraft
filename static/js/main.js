
/* =========================================
   InCraft — Main JavaScript
   static/js/main.js
   Sidebar Interactions + Global Utilities
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. SIDEBAR ELEMENTS
       ========================================= */

    const sidebar = document.getElementById("sidebar");

    // The sidebar toggle is now located in the navbar,
    // beside the global search bar.
    const sidebarToggle = document.getElementById("sidebarToggle");

    const sidebarSearch = document.getElementById("sidebarSearch");
    const sidebarAccount = document.getElementById("sidebarAccount");
    const sidebarAccountMenu = document.getElementById(
        "sidebarAccountMenu"
    );

    const globalSearch = document.getElementById("globalSearch");

    const mobileQuery = window.matchMedia("(max-width: 768px)");

    let sidebarBackdrop = document.querySelector(
        ".sidebar-mobile-backdrop"
    );

    // Create the mobile backdrop if the page does not contain one.
    if (!sidebarBackdrop && sidebar) {
        sidebarBackdrop = document.createElement("div");
        sidebarBackdrop.className = "sidebar-mobile-backdrop";
        sidebarBackdrop.setAttribute("aria-hidden", "true");

        document.body.appendChild(sidebarBackdrop);
    }


    /* =========================================
       2. SIDEBAR STATE
       ========================================= */

    function isMobile() {
        return mobileQuery.matches;
    }

    function closeAccountMenu() {
        if (!sidebarAccount || !sidebarAccountMenu) {
            return;
        }

        sidebarAccountMenu.hidden = true;

        sidebarAccount.setAttribute("aria-expanded", "false");
    }

    function openAccountMenu() {
        if (!sidebarAccount || !sidebarAccountMenu) {
            return;
        }

        sidebarAccountMenu.hidden = false;

        sidebarAccount.setAttribute("aria-expanded", "true");
    }

    function closeMobileSidebar() {
        document.body.classList.remove("sidebar-mobile-open");

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
            sidebarToggle.setAttribute("aria-label", "Open sidebar");
            sidebarToggle.setAttribute("title", "Open sidebar");

            const icon = sidebarToggle.querySelector("i");

            if (icon) {
                icon.classList.remove("fa-angles-left");
                icon.classList.add("fa-angles-right");
            }
        }
    }

    function openMobileSidebar() {
        document.body.classList.add("sidebar-mobile-open");

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "true");
            sidebarToggle.setAttribute("aria-label", "Close sidebar");
            sidebarToggle.setAttribute("title", "Close sidebar");

            const icon = sidebarToggle.querySelector("i");

            if (icon) {
                icon.classList.remove("fa-angles-right");
                icon.classList.add("fa-angles-left");
            }
        }
    }

    function closeSidebar() {
        if (isMobile()) {
            closeMobileSidebar();
        } else {
            document.body.classList.remove("sidebar-icon-only");

            if (sidebarToggle) {
                sidebarToggle.setAttribute("aria-expanded", "true");
                sidebarToggle.setAttribute(
                    "aria-label",
                    "Collapse sidebar"
                );
                sidebarToggle.setAttribute(
                    "title",
                    "Collapse sidebar"
                );

                const icon = sidebarToggle.querySelector("i");

                if (icon) {
                    icon.classList.remove("fa-angles-right");
                    icon.classList.add("fa-angles-left");
                }
            }
        }
    }

    function toggleSidebar() {
        if (!sidebar) {
            return;
        }

        closeAccountMenu();

        if (isMobile()) {
            if (
                document.body.classList.contains(
                    "sidebar-mobile-open"
                )
            ) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }

            return;
        }

        const isCollapsed = document.body.classList.toggle(
            "sidebar-icon-only"
        );

        if (sidebarToggle) {
            sidebarToggle.setAttribute(
                "aria-expanded",
                String(!isCollapsed)
            );

            sidebarToggle.setAttribute(
                "aria-label",
                isCollapsed ? "Expand sidebar" : "Collapse sidebar"
            );

            sidebarToggle.setAttribute(
                "title",
                isCollapsed ? "Expand sidebar" : "Collapse sidebar"
            );

            const icon = sidebarToggle.querySelector("i");

            if (icon) {
                icon.classList.toggle("fa-angles-left", !isCollapsed);
                icon.classList.toggle("fa-angles-right", isCollapsed);
            }
        }
    }


/* =========================================
   3. INITIAL SIDEBAR SETUP
   ========================================= */

if (sidebar) {

    // Reset sidebar state whenever the page loads.
    document.body.classList.remove("sidebar-mobile-open");

    if (isMobile()) {
        // Keep the sidebar closed on mobile.
        document.body.classList.remove("sidebar-icon-only");
        closeMobileSidebar();

    } else {
        // Keep the sidebar collapsed on desktop.
        document.body.classList.add("sidebar-icon-only");

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
            sidebarToggle.setAttribute("aria-label", "Expand sidebar");
            sidebarToggle.setAttribute("title", "Expand sidebar");

            const icon = sidebarToggle.querySelector("i");

            if (icon) {
                icon.classList.remove("fa-angles-left");
                icon.classList.add("fa-angles-right");
            }
        }
    }

    // The toggle is in the navbar, not inside the sidebar.
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            toggleSidebar();
        });
    }

    // Close the mobile drawer after choosing a page.
    sidebar.addEventListener("click", function (event) {
        const navLink = event.target.closest(".nav-item");

        if (navLink && isMobile()) {
            closeMobileSidebar();
        }
    });
}


// Clicking the backdrop closes the mobile drawer.
if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", function () {
        closeMobileSidebar();
    });
}


// Reconcile the layout when moving between desktop and mobile.
function handleViewportChange() {
    closeAccountMenu();

    if (isMobile()) {
        // Hide the sidebar when switching to mobile.
        document.body.classList.remove("sidebar-icon-only");
        closeMobileSidebar();

    } else {
        // Keep the sidebar collapsed when switching to desktop.
        document.body.classList.remove("sidebar-mobile-open");
        document.body.classList.add("sidebar-icon-only");

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
            sidebarToggle.setAttribute("aria-label", "Expand sidebar");
            sidebarToggle.setAttribute("title", "Expand sidebar");

            const icon = sidebarToggle.querySelector("i");

            if (icon) {
                icon.classList.remove("fa-angles-left");
                icon.classList.add("fa-angles-right");
            }
        }
    }
}

if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", handleViewportChange);
} else {
    // Compatibility with older browsers.
    mobileQuery.addListener(handleViewportChange);
}

    /* =========================================
       4. SIDEBAR SEARCH
       ========================================= */

    if (sidebarSearch) {
        sidebarSearch.addEventListener("click", function () {
            if (globalSearch) {
                globalSearch.focus();

                if (typeof globalSearch.select === "function") {
                    globalSearch.select();
                }
            } else {
                // The global search field may be on another page.
                window.location.href = "/dashboard";
            }

            if (isMobile()) {
                closeMobileSidebar();
            }
        });
    }


    /* =========================================
       5. ACCOUNT DROPDOWN
       ========================================= */

    if (sidebarAccount && sidebarAccountMenu) {
        sidebarAccount.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const isOpen =
                sidebarAccount.getAttribute("aria-expanded") === "true";

            if (isOpen) {
                closeAccountMenu();
            } else {
                openAccountMenu();
            }
        });

        sidebarAccountMenu.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    // Close the account menu when clicking elsewhere.
    document.addEventListener("click", function (event) {
        if (
            sidebarAccountMenu &&
            !sidebarAccountMenu.hidden &&
            !sidebarAccountMenu.contains(event.target) &&
            !sidebarAccount.contains(event.target)
        ) {
            closeAccountMenu();
        }
    });


    /* =========================================
       6. GLOBAL ESCAPE HANDLER
       ========================================= */

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        // Close the mobile drawer.
        if (
            document.body.classList.contains("sidebar-mobile-open")
        ) {
            closeMobileSidebar();
        }

        // Close the account menu.
        closeAccountMenu();

        // Close existing notification and user dropdowns.
        const dropdowns = document.querySelectorAll(
            ".notification-dropdown, .user-dropdown"
        );

        dropdowns.forEach(function (dropdown) {
            dropdown.style.display = "none";
        });

        // Preserve existing modal closing behavior.
        const modal = document.querySelector(".modal-overlay");

        if (modal) {
            modal.style.display = "none";
        }
    });


    /* =========================================
       7. CONFIRM DELETE ACTIONS
       ========================================= */

    const deleteButtons = document.querySelectorAll(
        ".delete-btn, .delete-product-btn"
    );

    deleteButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            const confirmed = confirm(
                "Are you sure you want to delete this record?"
            );

            if (!confirmed) {
                event.preventDefault();
            }
        });
    });


    /* =========================================
       8. FLASH MESSAGE AUTO HIDE
       ========================================= */

    const flashMessages = document.querySelectorAll(
        ".flash-message, .alert"
    );

    flashMessages.forEach(function (message) {
        window.setTimeout(function () {
            if (!message.isConnected) {
                return;
            }

            message.style.transition = "opacity 0.3s ease";
            message.style.opacity = "0";

            window.setTimeout(function () {
                message.remove();
            }, 300);
        }, 4000);
    });


    /* =========================================
       9. FORM SUBMIT PROTECTION
       ========================================= */

    const forms = document.querySelectorAll("form");

    forms.forEach(function (form) {
        form.addEventListener("submit", function () {
            const submitButton = form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

            if (!submitButton) {
                return;
            }

            if (submitButton.dataset.noLoading === "true") {
                return;
            }

            if (submitButton.disabled) {
                return;
            }

            submitButton.dataset.originalText =
                submitButton.tagName === "INPUT"
                    ? submitButton.value
                    : submitButton.innerHTML;

            submitButton.disabled = true;

            if (submitButton.tagName === "INPUT") {
                submitButton.value = "Processing...";
            } else {
                submitButton.innerHTML = "Processing...";
            }
        });
    });


    /* =========================================
       10. GLOBAL SEARCH KEYBOARD SHORTCUT
       ========================================= */

    document.addEventListener("keydown", function (event) {
        const activeElement = document.activeElement;

        const isTyping =
            activeElement &&
            (
                activeElement.matches("input, textarea, select") ||
                activeElement.isContentEditable
            );

        if (
            event.key === "/" &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey &&
            !isTyping
        ) {
            if (globalSearch) {
                event.preventDefault();
                globalSearch.focus();
            }
        }
    });


    /* =========================================
       11. CLEAR SEARCH WITH ESCAPE
       ========================================= */

    if (globalSearch) {
        globalSearch.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && globalSearch.value) {
                globalSearch.value = "";
            }
        });
    }


    /* =========================================
       12. IMAGE PREVIEW
       ========================================= */

    const imageInputs = document.querySelectorAll(
        'input[type="file"][accept*="image"]'
    );

    imageInputs.forEach(function (input) {
        input.addEventListener("change", function () {
            const file = input.files && input.files[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {
                alert("Please select a valid image file.");
                input.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = function (event) {
                const container = input.closest(
                    ".image-upload-area, .profile-photo-section"
                );

                if (!container) {
                    return;
                }

                const preview = container.querySelector(
                    ".image-preview, .profile-avatar"
                );

                if (!preview) {
                    return;
                }

                const image = document.createElement("img");

                image.src = event.target.result;
                image.alt = "Image Preview";

                preview.replaceChildren(image);
            };

            reader.readAsDataURL(file);
        });
    });


    /* =========================================
       13. NUMBER INPUT VALIDATION
       ========================================= */

    const numberInputs = document.querySelectorAll(
        'input[type="number"]'
    );

    numberInputs.forEach(function (input) {
        input.addEventListener("input", function () {
            const minimum = input.getAttribute("min");

            if (
                minimum !== null &&
                input.value !== "" &&
                Number(input.value) < Number(minimum)
            ) {
                input.value = minimum;
            }
        });
    });


    /* =========================================
       14. MOBILE TABLE SUPPORT
       ========================================= */

    const tables = document.querySelectorAll(".data-table");

    tables.forEach(function (table) {
        table.setAttribute("role", "table");
    });


    /* =========================================
       15. CURRENT YEAR
       ========================================= */

    const currentYear = document.querySelectorAll(".current-year");

    currentYear.forEach(function (element) {
        element.textContent = new Date().getFullYear();
    });


    /* =========================================
       16. TOOLTIP SUPPORT
       ========================================= */

    const tooltipElements = document.querySelectorAll("[data-tooltip]");

    tooltipElements.forEach(function (element) {
        element.setAttribute("title", element.dataset.tooltip);
    });


    /* =========================================
       17. SMOOTH INTERNAL LINKS
       ========================================= */

    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            let target;

            try {
                target = document.querySelector(targetId);
            } catch (error) {
                return;
            }

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });


    /* =========================================
       18. PAGE READY
       ========================================= */

    document.body.classList.add("page-ready");

});
