/* =========================================
   InCraft — Settings JavaScript
   static/js/settings.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. SETTINGS NAVIGATION
       ========================================= */

    const navItems =
        document.querySelectorAll(
            ".settings-nav-item"
        );

    const sections =
        document.querySelectorAll(
            ".settings-section"
        );


    navItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    const target =
                        item.dataset.section;


                    /* Remove active state */

                    navItems.forEach(
                        function (nav) {

                            nav.classList.remove(
                                "active"
                            );

                        }
                    );


                    sections.forEach(
                        function (section) {

                            section.classList.remove(
                                "active"
                            );

                        }
                    );


                    /* Activate selected section */

                    item.classList.add(
                        "active"
                    );


                    const targetSection =
                        document.getElementById(
                            target
                        );


                    if (targetSection) {

                        targetSection.classList.add(
                            "active"
                        );

                    }


                    /* Save selected section */

                    try {

                        localStorage.setItem(
                            "incraftSettingsSection",
                            target
                        );

                    } catch (error) {

                        console.log(
                            "Settings tab could not be saved."
                        );

                    }

                }
            );

        }
    );


    /* =========================================
       2. RESTORE SETTINGS SECTION
       ========================================= */

    try {

        const savedSection =
            localStorage.getItem(
                "incraftSettingsSection"
            );


        if (savedSection) {

            const savedNav =
                document.querySelector(
                    `[data-section="${savedSection}"]`
                );

            const savedContent =
                document.getElementById(
                    savedSection
                );


            if (
                savedNav &&
                savedContent
            ) {

                navItems.forEach(
                    function (nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                sections.forEach(
                    function (section) {

                        section.classList.remove(
                            "active"
                        );

                    }
                );


                savedNav.classList.add(
                    "active"
                );

                savedContent.classList.add(
                    "active"
                );

            }

        }

    } catch (error) {

        console.log(
            "Saved settings section unavailable."
        );

    }


    /* =========================================
       3. PROFILE IMAGE PREVIEW
       ========================================= */

    const profileImage =
        document.getElementById(
            "profile_image"
        );

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (
        profileImage &&
        profileAvatar
    ) {

        profileImage.addEventListener(
            "change",
            function () {

                const file =
                    profileImage.files[0];


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

                    profileImage.value = "";

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        profileAvatar.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="Profile Preview"
                            >
                        `;

                    };


                reader.readAsDataURL(file);

            }
        );

    }


    /* =========================================
       4. PASSWORD VALIDATION
       ========================================= */

    const currentPassword =
        document.getElementById(
            "current_password"
        );

    const newPassword =
        document.getElementById(
            "new_password"
        );

    const confirmPassword =
        document.getElementById(
            "confirm_password"
        );


    function validatePasswords() {

        if (
            !newPassword ||
            !confirmPassword
        ) {

            return true;

        }


        const newValue =
            newPassword.value;

        const confirmValue =
            confirmPassword.value;


        confirmPassword.classList.remove(
            "input-error"
        );


        if (
            confirmValue &&
            newValue !== confirmValue
        ) {

            confirmPassword.classList.add(
                "input-error"
            );

            return false;

        }


        return true;

    }


    if (newPassword) {

        newPassword.addEventListener(
            "input",
            validatePasswords
        );

    }


    if (confirmPassword) {

        confirmPassword.addEventListener(
            "input",
            validatePasswords
        );

    }


    /* =========================================
       5. PASSWORD FORM VALIDATION
       ========================================= */

    const settingsForms =
        document.querySelectorAll(
            ".settings-card form"
        );


    settingsForms.forEach(
        function (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    /*
                     * Only validate password fields
                     * when they are present in the form.
                     */

                    const formNewPassword =
                        form.querySelector(
                            "#new_password"
                        );

                    const formConfirmPassword =
                        form.querySelector(
                            "#confirm_password"
                        );


                    if (
                        formNewPassword &&
                        formConfirmPassword
                    ) {

                        if (
                            formNewPassword.value &&
                            formNewPassword.value.length < 6
                        ) {

                            event.preventDefault();

                            alert(
                                "New password must contain at least 6 characters."
                            );

                            formNewPassword.focus();

                            return;

                        }


                        if (
                            formNewPassword.value !==
                            formConfirmPassword.value
                        ) {

                            event.preventDefault();

                            alert(
                                "New password and confirmation do not match."
                            );

                            formConfirmPassword.focus();

                            return;

                        }

                    }

                }
            );

        }
    );


    /* =========================================
       6. NOTIFICATION PREFERENCES
       ========================================= */

    const notificationInputs =
        document.querySelectorAll(
            '#notifications input[type="checkbox"]'
        );


    const saveNotifications =
        document.getElementById(
            "saveNotifications"
        );


    if (saveNotifications) {

        saveNotifications.addEventListener(
            "click",
            function () {

                const preferences = {};


                notificationInputs.forEach(
                    function (input) {

                        preferences[input.name] =
                            input.checked;

                    }
                );


                /*
                 * Backend API will be connected later.
                 */

                console.log(
                    "Notification preferences:",
                    preferences
                );


                showSettingsMessage(
                    "Notification preferences saved."
                );

            }
        );

    }


    /* =========================================
       7. INVENTORY SETTINGS
       ========================================= */

    const saveInventorySettings =
        document.getElementById(
            "saveInventorySettings"
        );


    if (saveInventorySettings) {

        saveInventorySettings.addEventListener(
            "click",
            function () {

                const reorderLevel =
                    document.getElementById(
                        "default_reorder"
                    );

                const currency =
                    document.getElementById(
                        "currency"
                    );

                const tax =
                    document.getElementById(
                        "default_tax"
                    );

                const dateFormat =
                    document.getElementById(
                        "date_format"
                    );


                if (
                    reorderLevel &&
                    Number(reorderLevel.value) < 0
                ) {

                    alert(
                        "Reorder level cannot be negative."
                    );

                    reorderLevel.focus();

                    return;

                }


                if (
                    tax &&
                    (
                        Number(tax.value) < 0 ||
                        Number(tax.value) > 100
                    )
                ) {

                    alert(
                        "Tax must be between 0 and 100."
                    );

                    tax.focus();

                    return;

                }


                const settings = {

                    default_reorder:
                        reorderLevel
                            ? reorderLevel.value
                            : "",

                    currency:
                        currency
                            ? currency.value
                            : "",

                    default_tax:
                        tax
                            ? tax.value
                            : "",

                    date_format:
                        dateFormat
                            ? dateFormat.value
                            : ""

                };


                /*
                 * Flask/MySQL integration will be
                 * connected later.
                 */

                console.log(
                    "Inventory settings:",
                    settings
                );


                showSettingsMessage(
                    "Inventory settings saved."
                );

            }
        );

    }


    /* =========================================
       8. THEME
       ========================================= */

    const themeOptions =
        document.querySelectorAll(
            'input[name="theme"]'
        );


    function applyTheme(theme) {

        document.body.dataset.theme =
            theme;


        try {

            localStorage.setItem(
                "incraftTheme",
                theme
            );

        } catch (error) {

            console.log(
                "Theme preference could not be saved."
            );

        }

    }


    themeOptions.forEach(
        function (option) {

            option.addEventListener(
                "change",
                function () {

                    if (option.checked) {

                        applyTheme(
                            option.value
                        );

                    }

                }
            );

        }
    );


    /* Restore theme */

    try {

        const savedTheme =
            localStorage.getItem(
                "incraftTheme"
            );


        if (savedTheme) {

            const matchingTheme =
                document.querySelector(
                    `input[name="theme"][value="${savedTheme}"]`
                );


            if (matchingTheme) {

                matchingTheme.checked =
                    true;

                applyTheme(
                    savedTheme
                );

            }

        }

    } catch (error) {

        console.log(
            "Saved theme unavailable."
        );

    }


    /* =========================================
       9. COMPACT SIDEBAR
       ========================================= */

    const compactSidebar =
        document.getElementById(
            "compactSidebar"
        );


    if (compactSidebar) {

        try {

            compactSidebar.checked =
                localStorage.getItem(
                    "incraftCompactSidebar"
                ) === "true";

        } catch (error) {

            compactSidebar.checked =
                false;

        }


        compactSidebar.addEventListener(
            "change",
            function () {

                document.body.classList.toggle(
                    "sidebar-collapsed",
                    compactSidebar.checked
                );


                try {

                    localStorage.setItem(
                        "incraftCompactSidebar",
                        compactSidebar.checked
                    );

                } catch (error) {

                    console.log(
                        "Sidebar preference could not be saved."
                    );

                }

            }
        );

    }


    /* =========================================
       10. COMPACT TABLES
       ========================================= */

    const compactTables =
        document.getElementById(
            "compactTables"
        );


    if (compactTables) {

        try {

            compactTables.checked =
                localStorage.getItem(
                    "incraftCompactTables"
                ) === "true";

        } catch (error) {

            compactTables.checked =
                false;

        }


        document.body.classList.toggle(
            "compact-tables",
            compactTables.checked
        );


        compactTables.addEventListener(
            "change",
            function () {

                document.body.classList.toggle(
                    "compact-tables",
                    compactTables.checked
                );


                try {

                    localStorage.setItem(
                        "incraftCompactTables",
                        compactTables.checked
                    );

                } catch (error) {

                    console.log(
                        "Table preference could not be saved."
                    );

                }

            }
        );

    }


    /* =========================================
       11. SAVE APPEARANCE
       ========================================= */

    const saveAppearance =
        document.getElementById(
            "saveAppearance"
        );


    if (saveAppearance) {

        saveAppearance.addEventListener(
            "click",
            function () {

                const selectedTheme =
                    document.querySelector(
                        'input[name="theme"]:checked'
                    );


                if (selectedTheme) {

                    applyTheme(
                        selectedTheme.value
                    );

                }


                if (compactSidebar) {

                    localStorage.setItem(
                        "incraftCompactSidebar",
                        compactSidebar.checked
                    );

                }


                if (compactTables) {

                    localStorage.setItem(
                        "incraftCompactTables",
                        compactTables.checked
                    );

                }


                showSettingsMessage(
                    "Appearance preferences saved."
                );

            }
        );

    }


    /* =========================================
       12. SETTINGS MESSAGE
       ========================================= */

    function showSettingsMessage(message) {

        let messageBox =
            document.getElementById(
                "settingsMessage"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );

            messageBox.id =
                "settingsMessage";

            messageBox.style.position =
                "fixed";

            messageBox.style.right =
                "25px";

            messageBox.style.bottom =
                "25px";

            messageBox.style.zIndex =
                "2000";

            messageBox.style.padding =
                "11px 16px";

            messageBox.style.borderRadius =
                "7px";

            messageBox.style.background =
                "#222222";

            messageBox.style.color =
                "#ffffff";

            messageBox.style.fontSize =
                "12px";

            document.body.appendChild(
                messageBox
            );

        }


        messageBox.textContent =
            message;

        messageBox.style.display =
            "block";


        clearTimeout(
            messageBox.hideTimer
        );


        messageBox.hideTimer =
            setTimeout(
                function () {

                    messageBox.style.display =
                        "none";

                },
                2500
            );

    }


    /* =========================================
       13. SETTINGS READY
       ========================================= */

    document.body.classList.add(
        "settings-ready"
    );

});