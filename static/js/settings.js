
/* =========================================================
   InCraft — Settings JavaScript
   File: static/js/settings.js

   Features:
   - Settings tab navigation
   - Remember last selected tab
   - Password visibility and strength validation
   - Password confirmation validation
   - Profile photo preview
   - Theme preferences
   - Compact sidebar and table preferences
   - Notification preferences
   - Inventory preferences
   - Account and system preferences
   - Save feedback
   - Delete-account confirmation dialog

   NOTE:
   Browser preferences are saved in localStorage.
   Profile and password changes require a working Flask
   backend route at main.settings.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    function readStorage(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            console.warn(`Unable to read preference: ${key}`, error);
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn(`Unable to save preference: ${key}`, error);
            return false;
        }
    }

    function readJSON(key, fallback = {}) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.warn(`Unable to parse preference: ${key}`, error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Unable to save preference: ${key}`, error);
            return false;
        }
    }

    function setFeedback(elementId, message, type = "success") {
        const element = document.getElementById(elementId);

        if (!element) return;

        element.textContent = message;
        element.dataset.status = type;
        element.classList.add("visible");

        if (element._feedbackTimeout) {
            clearTimeout(element._feedbackTimeout);
        }

        element._feedbackTimeout = setTimeout(() => {
            element.classList.remove("visible");
        }, 3000);
    }

    function showSaveFeedback(button, message = "Saved") {
        if (!button) return;

        const originalText = button.dataset.originalText ||
            button.textContent.trim();

        button.dataset.originalText = originalText;
        button.textContent = message;
        button.classList.add("is-saved");

        if (button._feedbackTimeout) {
            clearTimeout(button._feedbackTimeout);
        }

        button._feedbackTimeout = setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("is-saved");
        }, 1600);
    }

    function setChecked(id, value) {
        const element = document.getElementById(id);
        if (element) element.checked = Boolean(value);
    }

    function setValue(id, value) {
        const element = document.getElementById(id);

        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }

    function getChecked(id, fallback = false) {
        const element = document.getElementById(id);
        return element ? element.checked : fallback;
    }

    function getValue(id, fallback = "") {
        const element = document.getElementById(id);
        return element ? element.value : fallback;
    }

    /* =====================================================
       SETTINGS NAVIGATION
       ===================================================== */

    const navItems = $$(".settings-nav-item");
    const sections = $$(".settings-section");

    function activateSection(sectionId, options = {}) {
        const targetSection = document.getElementById(sectionId);
        const targetNav = $(
            `.settings-nav-item[data-section="${sectionId}"]`
        );

        if (!targetSection || !targetNav) return;

        navItems.forEach((item) => {
            const active = item === targetNav;

            item.classList.toggle("active", active);
            item.setAttribute("aria-selected", String(active));
            item.setAttribute("tabindex", active ? "0" : "-1");
        });

        sections.forEach((section) => {
            const active = section === targetSection;

            section.classList.toggle("active", active);
            section.setAttribute("aria-hidden", String(!active));
            section.hidden = false;
        });

        writeStorage("incraftSettingsSection", sectionId);

        if (options.scroll !== false) {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    }

    navItems.forEach((item, index) => {
        item.addEventListener("click", function () {
            activateSection(item.dataset.section);
        });

        item.addEventListener("keydown", function (event) {
            let nextIndex = index;

            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                nextIndex = (index + 1) % navItems.length;
            } else if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp"
            ) {
                nextIndex = (index - 1 + navItems.length) % navItems.length;
            } else if (event.key === "Home") {
                nextIndex = 0;
            } else if (event.key === "End") {
                nextIndex = navItems.length - 1;
            } else {
                return;
            }

            event.preventDefault();

            const nextItem = navItems[nextIndex];
            activateSection(nextItem.dataset.section, { scroll: false });
            nextItem.focus();
        });
    });

    const savedSection = readStorage("incraftSettingsSection", "account");

    activateSection(
        document.getElementById(savedSection) &&
        $(`.settings-nav-item[data-section="${savedSection}"]`)
            ? savedSection
            : "account",
        { scroll: false }
    );

    /* =====================================================
       PASSWORD VISIBILITY
       ===================================================== */

    $$("[data-password-target]").forEach((button) => {
        button.addEventListener("click", function () {
            const targetId = button.dataset.passwordTarget;
            const input = document.getElementById(targetId);

            if (!input) return;

            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";
            button.setAttribute("aria-pressed", String(showPassword));

            const labels = {
                current_password: "current password",
                new_password: "new password",
                confirm_password: "confirmation password"
            };

            const description = labels[targetId] || "password";

            button.setAttribute(
                "aria-label",
                `${showPassword ? "Hide" : "Show"} ${description}`
            );
        });
    });

    /* =====================================================
       PASSWORD STRENGTH
       ===================================================== */

    const passwordInput = $("#new_password");
    const strengthFill = $("#passwordStrengthFill");
    const strengthText = $("#passwordStrengthText");
    const confirmPassword = $("#confirm_password");

    function updatePasswordStrength() {
        if (!passwordInput || !strengthFill || !strengthText) return;

        const password = passwordInput.value;

        if (!password) {
            strengthFill.style.width = "0%";
            strengthText.textContent = "Enter a new password";
            strengthText.dataset.strength = "empty";
            return;
        }

        let score = 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        let label = "Very weak";
        let width = 16;

        if (score >= 6) {
            label = "Very strong";
            width = 100;
        } else if (score === 5) {
            label = "Strong";
            width = 83;
        } else if (score === 4) {
            label = "Moderate";
            width = 66;
        } else if (score === 3) {
            label = "Weak";
            width = 50;
        } else if (score === 2) {
            label = "Very weak";
            width = 33;
        }

        strengthFill.style.width = `${width}%`;
        strengthText.textContent = `Password strength: ${label}`;
        strengthText.dataset.strength = label.toLowerCase().replace(" ", "-");
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", updatePasswordStrength);
    }

    /* =====================================================
       PASSWORD MATCH VALIDATION
       ===================================================== */

    function validatePasswords() {
        if (!passwordInput || !confirmPassword) return true;

        const password = passwordInput.value;
        const confirmation = confirmPassword.value;

        if (!confirmation) {
            confirmPassword.setCustomValidity("");
            return true;
        }

        if (password !== confirmation) {
            confirmPassword.setCustomValidity("Passwords do not match.");
            return false;
        }

        confirmPassword.setCustomValidity("");
        return true;
    }

    if (confirmPassword) {
        confirmPassword.addEventListener("input", validatePasswords);
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", validatePasswords);
    }

    updatePasswordStrength();

    /* =====================================================
       PASSWORD FORM VALIDATION
       ===================================================== */

    const passwordForm = $("#passwordForm");

    if (passwordForm) {
        passwordForm.addEventListener("submit", function (event) {
            if (!validatePasswords()) {
                event.preventDefault();
                confirmPassword.reportValidity();
                confirmPassword.focus();
                return;
            }

            if (passwordInput && passwordInput.value.length < 8) {
                event.preventDefault();
                passwordInput.setCustomValidity(
                    "Your new password must contain at least 8 characters."
                );
                passwordInput.reportValidity();
                passwordInput.focus();
                return;
            }

            if (passwordInput) {
                passwordInput.setCustomValidity("");
            }
        });
    }

    /* =====================================================
       PROFILE FORM VALIDATION
       ===================================================== */

    const profileForm = $("#profileForm");

    if (profileForm) {
        profileForm.addEventListener("submit", function (event) {
            const username = $("#username");
            const email = $("#email");

            if (username && !username.value.trim()) {
                event.preventDefault();
                username.setCustomValidity("Please enter a username.");
                username.reportValidity();
                username.focus();
                return;
            }

            if (email && !email.checkValidity()) {
                event.preventDefault();
                email.reportValidity();
                email.focus();
                return;
            }

            if (username) username.setCustomValidity("");
        });

        const username = $("#username");

        if (username) {
            username.addEventListener("input", function () {
                username.setCustomValidity("");
            });
        }
    }

    /* =====================================================
       PROFILE PHOTO PREVIEW
       ===================================================== */

    const profilePhotoInput = $("#profilePhotoInput");
    const profileAvatar = $("#profileAvatar");
    const removeProfilePhoto = $("#removeProfilePhoto");

    const defaultAvatarContent = profileAvatar
        ? profileAvatar.innerHTML
        : "";

    let profilePhotoURL = null;

    function clearProfilePhotoPreview() {
        if (profilePhotoURL) {
            URL.revokeObjectURL(profilePhotoURL);
            profilePhotoURL = null;
        }

        if (profileAvatar) {
            profileAvatar.innerHTML = defaultAvatarContent;
            profileAvatar.style.backgroundImage = "";
            profileAvatar.classList.remove("has-photo");
        }

        if (profilePhotoInput) {
            profilePhotoInput.value = "";
        }
    }

    if (profilePhotoInput) {
        profilePhotoInput.addEventListener("change", function () {
            const file = profilePhotoInput.files?.[0];

            if (!file) return;

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {
                alert("Choose a JPG, PNG or WebP image.");
                profilePhotoInput.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("The profile image must be smaller than 5 MB.");
                profilePhotoInput.value = "";
                return;
            }

            if (profilePhotoURL) {
                URL.revokeObjectURL(profilePhotoURL);
            }

            profilePhotoURL = URL.createObjectURL(file);

            if (profileAvatar) {
                profileAvatar.innerHTML = "";
                profileAvatar.style.backgroundImage =
                    `url("${profilePhotoURL}")`;
                profileAvatar.style.backgroundSize = "cover";
                profileAvatar.style.backgroundPosition = "center";
                profileAvatar.classList.add("has-photo");
            }
        });
    }

    if (removeProfilePhoto) {
        removeProfilePhoto.addEventListener("click", function () {
            clearProfilePhotoPreview();
        });
    }

    /* =====================================================
       THEME PREFERENCES
       ===================================================== */

    const themeOptions = $$('input[name="theme"]');
    const saveAppearance = $("#saveAppearance");
    const compactTables = $("#compactTables");

    /*
     * Resolve the selected preference to the actual theme.
     * The saved preference can be "system", while the effective
     * theme applied to the page is either "light" or "dark".
     */
    function getPreferredTheme(theme) {
        if (theme === "system") {
            return window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: light)").matches
                ? "light"
                : "dark";
        }

        return theme === "light" ? "light" : "dark";
    }

    function applyTheme(theme, persist = true) {
        const validThemes = ["dark", "light", "system"];

        if (!validThemes.includes(theme)) {
            theme = "dark";
        }

        const effectiveTheme = getPreferredTheme(theme);
        const root = document.documentElement;
        const body = document.body;

        /*
         * Keep the selected preference separate from the resolved theme.
         *
         * data-theme:
         *   The effective theme used by theme.css.
         *
         * data-theme-preference:
         *   The user's selected preference: dark, light, or system.
         *
         * This lets the shared base template and the Settings page
         * use the same theme state across the entire application.
         */
        root.dataset.themePreference = theme;
        root.dataset.theme = effectiveTheme;

        body.dataset.themePreference = theme;
        body.dataset.theme = effectiveTheme;

        root.classList.toggle("theme-light", effectiveTheme === "light");
        root.classList.toggle("theme-dark", effectiveTheme === "dark");

        body.classList.toggle("theme-light", effectiveTheme === "light");
        body.classList.toggle("theme-dark", effectiveTheme === "dark");

        if (persist) {
            writeStorage("incraftTheme", theme);
        }

        themeOptions.forEach((option) => {
            option.checked = option.value === theme;
        });
    }

    /*
     * Restore the saved preference without rewriting localStorage.
     * The global theme initialization in base.html should also read
     * this same incraftTheme preference.
     */
    const storedTheme = readStorage("incraftTheme", "dark");
    applyTheme(storedTheme, false);

    themeOptions.forEach((option) => {
        option.addEventListener("change", function () {
            if (option.checked) {
                applyTheme(option.value);
            }
        });
    });

    /*
     * If "system" is selected, respond to changes in the operating
     * system's light/dark preference while keeping "system" selected.
     */
    if (window.matchMedia) {
        const systemTheme = window.matchMedia(
            "(prefers-color-scheme: light)"
        );

        const updateSystemTheme = () => {
            if (readStorage("incraftTheme", "dark") === "system") {
                applyTheme("system", false);
            }
        };

        if (systemTheme.addEventListener) {
            systemTheme.addEventListener("change", updateSystemTheme);
        } else if (systemTheme.addListener) {
            systemTheme.addListener(updateSystemTheme);
        }
    }

    /* =====================================================
       COMPACT TABLES
       ===================================================== */

    function applyCompactTables(enabled) {
        document.body.classList.toggle("compact-tables", enabled);
        document.documentElement.classList.toggle("compact-tables", enabled);

        writeStorage("incraftCompactTables", String(enabled));

        if (compactTables) {
            compactTables.checked = enabled;
        }
    }

    applyCompactTables(
        readStorage("incraftCompactTables", "false") === "true"
    );

    if (compactTables) {
        compactTables.addEventListener("change", function () {
            applyCompactTables(compactTables.checked);
        });
    }

    /* =====================================================
       APPEARANCE SAVE BUTTON
       ===================================================== */

    if (saveAppearance) {
        saveAppearance.addEventListener("click", function () {
            const selectedTheme = $(
                'input[name="theme"]:checked'
            );

            if (selectedTheme) {
                applyTheme(selectedTheme.value);
            }

            applyCompactTables(getChecked("compactTables"));

            showSaveFeedback(saveAppearance, "Preferences Saved");
            setFeedback(
                "appearanceFeedback",
                "Appearance preferences saved on this device."
            );
        });
    }

    /* =====================================================
       SIDEBAR PREFERENCES
       ===================================================== */

    const compactSidebar = $("#compactSidebar");
    const rememberSidebar = $("#rememberSidebar");
    const saveSidebarSettings = $("#saveSidebarSettings");

    function applyCompactSidebar(enabled) {
        document.body.classList.toggle("compact-sidebar", enabled);
        document.documentElement.classList.toggle("compact-sidebar", enabled);

        writeStorage("incraftCompactSidebar", String(enabled));

        if (compactSidebar) {
            compactSidebar.checked = enabled;
        }
    }

    const savedCompactSidebar =
        readStorage("incraftCompactSidebar", "false") === "true";

    applyCompactSidebar(savedCompactSidebar);

    if (compactSidebar) {
        compactSidebar.addEventListener("change", function () {
            applyCompactSidebar(compactSidebar.checked);
        });
    }

    if (rememberSidebar) {
        rememberSidebar.checked =
            readStorage("incraftRememberSidebar", "true") === "true";
    }

    if (saveSidebarSettings) {
        saveSidebarSettings.addEventListener("click", function () {
            applyCompactSidebar(getChecked("compactSidebar"));

            writeStorage(
                "incraftRememberSidebar",
                String(getChecked("rememberSidebar", true))
            );

            showSaveFeedback(saveSidebarSettings, "Preferences Saved");
            setFeedback(
                "sidebarFeedback",
                "Sidebar preferences saved on this device."
            );
        });
    }

    /* =====================================================
       NOTIFICATION PREFERENCES
       ===================================================== */

    const notificationIds = [
        "lowStockAlerts",
        "outOfStockAlerts",
        "saleCompleted",
        "securityAlerts"
    ];

    function collectNotificationPreferences() {
        return {
            lowStock: getChecked("lowStockAlerts", true),
            outOfStock: getChecked("outOfStockAlerts", true),
            saleCompleted: getChecked("saleCompleted", true),
            security: getChecked("securityAlerts", true)
        };
    }

    function restoreNotificationPreferences() {
        const saved = readJSON("incraftNotificationPreferences", null);

        if (!saved) return;

        setChecked("lowStockAlerts", saved.lowStock);
        setChecked("outOfStockAlerts", saved.outOfStock);
        setChecked("saleCompleted", saved.saleCompleted);
        setChecked("securityAlerts", saved.security);
    }

    restoreNotificationPreferences();

    const saveNotifications = $("#saveNotifications");

    if (saveNotifications) {
        saveNotifications.addEventListener("click", function () {
            const saved = writeJSON(
                "incraftNotificationPreferences",
                collectNotificationPreferences()
            );

            if (saved) {
                showSaveFeedback(saveNotifications, "Preferences Saved");
                setFeedback(
                    "notificationsFeedback",
                    "Notification preferences saved on this device."
                );
            } else {
                setFeedback(
                    "notificationsFeedback",
                    "Unable to save preferences in this browser.",
                    "error"
                );
            }
        });
    }

    /* =====================================================
       INVENTORY PREFERENCES
       ===================================================== */

    const saveInventorySettings = $("#saveInventorySettings");

    function collectInventoryPreferences() {
        return {
            reorderLevel: getValue("default_reorder", "10"),
            currency: getValue("currency", "INR"),
            tax: getValue("default_tax", "18"),
            dateFormat: getValue("date_format", "DD-MM-YYYY")
        };
    }

    function restoreInventoryPreferences() {
        const saved = readJSON("incraftInventoryPreferences", null);

        if (!saved) return;

        setValue("default_reorder", saved.reorderLevel);
        setValue("currency", saved.currency);
        setValue("default_tax", saved.tax);
        setValue("date_format", saved.dateFormat);
    }

    restoreInventoryPreferences();

    function validateInventoryPreferences() {
        const reorder = $("#default_reorder");
        const tax = $("#default_tax");

        if (reorder && (!reorder.checkValidity() || Number(reorder.value) < 0)) {
            reorder.reportValidity();
            reorder.focus();
            return false;
        }

        if (tax && (!tax.checkValidity() || Number(tax.value) < 0 ||
            Number(tax.value) > 100)) {
            tax.reportValidity();
            tax.focus();
            return false;
        }

        return true;
    }

    if (saveInventorySettings) {
        saveInventorySettings.addEventListener("click", function () {
            if (!validateInventoryPreferences()) return;

            const saved = writeJSON(
                "incraftInventoryPreferences",
                collectInventoryPreferences()
            );

            if (saved) {
                showSaveFeedback(saveInventorySettings, "Settings Saved");
                setFeedback(
                    "inventoryFeedback",
                    "Inventory defaults saved on this device."
                );
            } else {
                setFeedback(
                    "inventoryFeedback",
                    "Unable to save preferences in this browser.",
                    "error"
                );
            }
        });
    }

    /* =====================================================
       ACCOUNT PREFERENCES
       ===================================================== */

    const accountPreferenceIds = [
        "keepSignedIn",
        "helpfulTips",
        "keyboardShortcuts"
    ];

    function restoreAccountPreferences() {
        const saved = readJSON("incraftAccountPreferences", null);

        if (!saved) return;

        accountPreferenceIds.forEach((id) => {
            if (Object.prototype.hasOwnProperty.call(saved, id)) {
                setChecked(id, saved[id]);
            }
        });
    }

    function saveAccountPreferences() {
        const preferences = {};

        accountPreferenceIds.forEach((id) => {
            preferences[id] = getChecked(id);
        });

        writeJSON("incraftAccountPreferences", preferences);
    }

    restoreAccountPreferences();

    accountPreferenceIds.forEach((id) => {
        const input = document.getElementById(id);

        if (input) {
            input.addEventListener("change", saveAccountPreferences);
        }
    });

    /* =====================================================
       SYSTEM PREFERENCES
       ===================================================== */

    const systemPreferenceIds = [
        "reduceAnimations",
        "confirmNavigation"
    ];

    function applySystemPreferences() {
        const reduceMotion = getChecked("reduceAnimations");

        document.documentElement.classList.toggle(
            "reduce-motion",
            reduceMotion
        );

        document.body.classList.toggle(
            "reduce-motion",
            reduceMotion
        );
    }

    function restoreSystemPreferences() {
        const saved = readJSON("incraftSystemPreferences", null);

        if (saved) {
            systemPreferenceIds.forEach((id) => {
                if (Object.prototype.hasOwnProperty.call(saved, id)) {
                    setChecked(id, saved[id]);
                }
            });
        }

        applySystemPreferences();
    }

    function saveSystemPreferences() {
        const preferences = {};

        systemPreferenceIds.forEach((id) => {
            preferences[id] = getChecked(id);
        });

        writeJSON("incraftSystemPreferences", preferences);
        applySystemPreferences();
    }

    restoreSystemPreferences();

    systemPreferenceIds.forEach((id) => {
        const input = document.getElementById(id);

        if (input) {
            input.addEventListener("change", saveSystemPreferences);
        }
    });

    /* =====================================================
       REDUCED MOTION
       ===================================================== */

    const reducedMotionStyleId = "incraftReducedMotionStyle";

    if (!document.getElementById(reducedMotionStyleId)) {
        const style = document.createElement("style");
        style.id = reducedMotionStyleId;
        style.textContent = `
            .reduce-motion *,
            .reduce-motion *::before,
            .reduce-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    /* =====================================================
       DELETE ACCOUNT DIALOG
       ===================================================== */

    const openDeleteDialog = $("#openDeleteDialog");
    const deleteAccountDialog = $("#deleteAccountDialog");
    const cancelDeleteDialog = $("#cancelDeleteDialog");

    if (openDeleteDialog && deleteAccountDialog) {
        openDeleteDialog.addEventListener("click", function () {
            if (typeof deleteAccountDialog.showModal === "function") {
                deleteAccountDialog.showModal();
            } else {
                deleteAccountDialog.setAttribute("open", "");
            }
        });
    }

    if (cancelDeleteDialog && deleteAccountDialog) {
        cancelDeleteDialog.addEventListener("click", function () {
            if (typeof deleteAccountDialog.close === "function") {
                deleteAccountDialog.close();
            } else {
                deleteAccountDialog.removeAttribute("open");
            }
        });
    }

    if (deleteAccountDialog) {
        deleteAccountDialog.addEventListener("click", function (event) {
            if (event.target === deleteAccountDialog) {
                if (typeof deleteAccountDialog.close === "function") {
                    deleteAccountDialog.close();
                } else {
                    deleteAccountDialog.removeAttribute("open");
                }
            }
        });
    }

    /*
     * The confirmDeleteAccount button intentionally remains disabled
     * until a real, authenticated server-side deletion endpoint exists.
     * Never delete account data using client-side JavaScript alone.
     */

    /* =====================================================
       CONFIRM BEFORE LEAVING UNSAVED FORMS
       ===================================================== */

    let formHasChanges = false;

    const trackedForms = [profileForm, passwordForm].filter(Boolean);

    trackedForms.forEach((form) => {
        form.addEventListener("input", function () {
            formHasChanges = true;
        });

        form.addEventListener("change", function () {
            formHasChanges = true;
        });

        form.addEventListener("submit", function () {
            formHasChanges = false;
        });
    });

    window.addEventListener("beforeunload", function (event) {
        if (
            formHasChanges &&
            getChecked("confirmNavigation", true)
        ) {
            event.preventDefault();
            event.returnValue = "";
        }
    });

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    notificationIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.setAttribute("autocomplete", "off");
    });

    console.info("InCraft settings initialized.");
});
