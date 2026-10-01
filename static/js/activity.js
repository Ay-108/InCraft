/* =========================================
   InCraft — Activity JavaScript
   static/js/activity.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. ELEMENTS
       ========================================= */

    const searchInput =
        document.getElementById("activitySearch");

    const dateFilter =
        document.getElementById("activityDateFilter");

    const typeFilter =
        document.getElementById("activityTypeFilter");

    const userFilter =
        document.getElementById("activityUserFilter");

    const statusFilter =
        document.getElementById("activityStatusFilter");

    const activityItems =
        document.querySelectorAll(".timeline-item");

    const noResults =
        document.getElementById("noActivityResults");

    const activityCount =
        document.getElementById("activityCount");


    /* =========================================
       2. FILTER ACTIVITIES
       ========================================= */

    function filterActivities() {

        const search =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        const type =
            typeFilter
                ? typeFilter.value
                    .trim()
                    .toLowerCase()
                : "";

        const user =
            userFilter
                ? userFilter.value
                : "";

        const status =
            statusFilter
                ? statusFilter.value
                    .trim()
                    .toLowerCase()
                : "";


        let visibleCount = 0;


        activityItems.forEach(
            function (item) {

                const text =
                    (
                        item.dataset.search ||
                        item.textContent
                    ).toLowerCase();


                const itemType =
                    (
                        item.dataset.type ||
                        ""
                    ).toLowerCase();


                const itemUser =
                    item.dataset.user ||
                    "";


                const itemStatus =
                    (
                        item.dataset.status ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    text.includes(search);


                const matchesType =
                    !type ||
                    itemType === type;


                const matchesUser =
                    !user ||
                    itemUser === user;


                const matchesStatus =
                    !status ||
                    itemStatus === status;


                const visible =
                    matchesSearch &&
                    matchesType &&
                    matchesUser &&
                    matchesStatus;


                item.style.display =
                    visible
                        ? "flex"
                        : "none";


                if (visible) {
                    visibleCount++;
                }

            }
        );


        if (activityCount) {

            activityCount.textContent =
                visibleCount;

        }


        if (noResults) {

            noResults.style.display =
                visibleCount === 0
                    ? "block"
                    : "none";

        }

    }


    /* =========================================
       3. SEARCH
       ========================================= */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterActivities
        );

    }


    /* =========================================
       4. TYPE FILTER
       ========================================= */

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            filterActivities
        );

    }


    /* =========================================
       5. USER FILTER
       ========================================= */

    if (userFilter) {

        userFilter.addEventListener(
            "change",
            filterActivities
        );

    }


    /* =========================================
       6. STATUS FILTER
       ========================================= */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterActivities
        );

    }


    /* =========================================
       7. DATE FILTER
       ========================================= */

    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            function () {

                /*
                 * Actual date filtering will later
                 * be performed by Flask/MySQL.
                 */

                console.log(
                    "Activity date filter:",
                    dateFilter.value
                );


                filterActivities();

            }
        );

    }


    /* =========================================
       8. RESET FILTERS
       ========================================= */

    const resetFilters =
        document.getElementById(
            "resetActivityFilters"
        );


    if (resetFilters) {

        resetFilters.addEventListener(
            "click",
            function () {

                if (searchInput) {
                    searchInput.value = "";
                }

                if (dateFilter) {
                    dateFilter.value = "";
                }

                if (typeFilter) {
                    typeFilter.value = "";
                }

                if (userFilter) {
                    userFilter.value = "";
                }

                if (statusFilter) {
                    statusFilter.value = "";
                }


                filterActivities();

            }
        );

    }


    /* =========================================
       9. ACTIVITY DETAILS
       ========================================= */

    const activityButtons =
        document.querySelectorAll(
            ".view-activity-btn"
        );


    activityButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const activityId =
                        button.dataset.activityId;


                    if (!activityId) {
                        return;
                    }


                    console.log(
                        "Activity selected:",
                        activityId
                    );

                }
            );

        }
    );


    /* =========================================
       10. EXPORT ACTIVITY
       ========================================= */

    const exportActivity =
        document.getElementById(
            "exportActivityBtn"
        );


    if (exportActivity) {

        exportActivity.addEventListener(
            "click",
            function () {

                /*
                 * The actual CSV/Excel generation
                 * will be handled by Flask later.
                 */

                alert(
                    "Activity log export will be connected to Flask later."
                );

            }
        );

    }


    /* =========================================
       11. PRINT ACTIVITY
       ========================================= */

    const printActivity =
        document.getElementById(
            "printActivity"
        );


    if (printActivity) {

        printActivity.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }


    /* =========================================
       12. PAGINATION
       ========================================= */

    const previousPage =
        document.getElementById(
            "previousActivityPage"
        );

    const nextPage =
        document.getElementById(
            "nextActivityPage"
        );

    const pageButtons =
        document.querySelectorAll(
            ".pagination-page"
        );


    let currentPage = 1;


    pageButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    pageButtons.forEach(
                        function (page) {

                            page.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentPage =
                        Number(
                            button.textContent
                        );


                    updatePaginationButtons();

                }
            );

        }
    );


    if (previousPage) {

        previousPage.addEventListener(
            "click",
            function () {

                if (currentPage <= 1) {
                    return;
                }


                currentPage--;

                setActivePage(
                    currentPage
                );

                updatePaginationButtons();

            }
        );

    }


    if (nextPage) {

        nextPage.addEventListener(
            "click",
            function () {

                const totalPages =
                    pageButtons.length;


                if (
                    currentPage >= totalPages
                ) {
                    return;
                }


                currentPage++;

                setActivePage(
                    currentPage
                );

                updatePaginationButtons();

            }
        );

    }


    function setActivePage(page) {

        pageButtons.forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    Number(
                        button.textContent
                    ) === page
                );

            }
        );

    }


    function updatePaginationButtons() {

        const totalPages =
            pageButtons.length;


        if (previousPage) {

            previousPage.disabled =
                currentPage <= 1;

        }


        if (nextPage) {

            nextPage.disabled =
                currentPage >= totalPages;

        }

    }


    /* =========================================
       13. INITIAL STATE
       ========================================= */

    filterActivities();

    updatePaginationButtons();


    document.body.classList.add(
        "activity-ready"
    );

});