/* =========================================
   InCraft — Login JavaScript
   static/js/login.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. PASSWORD VISIBILITY
       ========================================= */

    const passwordInput =
        document.getElementById("password");

    const passwordToggle =
        document.getElementById("passwordToggle");


    if (passwordInput && passwordToggle) {

        passwordToggle.addEventListener(
            "click",
            function () {

                if (passwordInput.type === "password") {

                    passwordInput.type = "text";

                    passwordToggle.textContent = "Hide";

                    passwordToggle.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    passwordInput.type = "password";

                    passwordToggle.textContent = "Show";

                    passwordToggle.setAttribute(
                        "aria-label",
                        "Show password"
                    );

                }

            }
        );

    }


    /* =========================================
       2. LOGIN FORM VALIDATION
       ========================================= */

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            function (event) {

                const email =
                    document.getElementById("email");

                const password =
                    document.getElementById("password");


                if (!email || !password) {
                    return;
                }


                const emailValue =
                    email.value.trim();

                const passwordValue =
                    password.value;


                /* Clear previous errors */

                document
                    .querySelectorAll(".login-field-error")
                    .forEach(function (error) {

                        error.remove();

                    });


                let hasError = false;


                /* Email validation */

                if (!emailValue) {

                    showError(
                        email,
                        "Email is required."
                    );

                    hasError = true;

                } else if (
                    !isValidEmail(emailValue)
                ) {

                    showError(
                        email,
                        "Please enter a valid email address."
                    );

                    hasError = true;

                }


                /* Password validation */

                if (!passwordValue) {

                    showError(
                        password,
                        "Password is required."
                    );

                    hasError = true;

                }


                if (hasError) {

                    event.preventDefault();

                    return;

                }

            }
        );

    }


    /* =========================================
       3. EMAIL VALIDATION
       ========================================= */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );

    }


    /* =========================================
       4. DISPLAY FIELD ERROR
       ========================================= */

    function showError(input, message) {

        input.style.borderColor = "#c62828";


        const error =
            document.createElement("small");


        error.className =
            "login-field-error";


        error.textContent =
            message;


        error.style.color =
            "#c62828";


        error.style.fontSize =
            "11px";


        error.style.marginTop =
            "5px";


        input.parentElement.appendChild(
            error
        );

    }


    /* =========================================
       5. REMOVE ERROR ON INPUT
       ========================================= */

    const loginInputs =
        document.querySelectorAll(
            "#loginForm input"
        );


    loginInputs.forEach(
        function (input) {

            input.addEventListener(
                "input",
                function () {

                    input.style.borderColor =
                        "";


                    const error =
                        input.parentElement.querySelector(
                            ".login-field-error"
                        );


                    if (error) {
                        error.remove();
                    }

                }
            );

        }
    );

});