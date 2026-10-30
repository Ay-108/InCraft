/* =========================================
   InCraft — Activity History JavaScript
   static/js/activity.js

   Search
   Filters
   Pagination
   Export
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       ELEMENTS
       ========================================= */

    const searchInput =
        document.getElementById("activitySearch");

    const dateFilter =
        document.getElementById("activityDateFilter");

    const typeFilter =
        document.getElementById("activityTypeFilter");

    const userFilter =
        document.getElementById("activityUserFilter");

    const actionFilter =
        document.getElementById("activityActionFilter");

    const exportButton =
        document.getElementById("exportActivityBtn");

    const activityCount =
        document.getElementById("activityCount");

    const noResults =
        document.getElementById("noActivityResults");

    const timeline =
        document.getElementById("activityTimeline");

    const timelineItems =
        Array.from(
            document.querySelectorAll(".timeline-item")
        );

    const tableRows =
        Array.from(
            document.querySelectorAll(
                "#activityTableBody tr[data-search]"
            )
        );

    const previousPage =
        document.getElementById(
            "previousActivityPage"
        );

    const nextPage =
        document.getElementById(
            "nextActivityPage"
        );

    const paginationPages =
        document.getElementById(
            "activityPaginationPages"
        );


    /* =========================================
       SETTINGS
       ========================================= */

    const ITEMS_PER_PAGE = 6;

    let currentPage = 1;

    let filteredTimelineItems = [];

    let filteredTableRows = [];


    /* =========================================
       HELPERS
       ========================================= */

    function normalize(value) {

        return String(value || "")
            .trim()
            .toLowerCase();

    }


    function getToday() {

        const date = new Date();

        date.setHours(
            0,
            0,
            0,
            0
        );

        return date;

    }


    function getStartOfWeek() {

        const date = getToday();

        const day = date.getDay();

        const difference =
            day === 0
                ? 6
                : day - 1;

        date.setDate(
            date.getDate() - difference
        );

        return date;

    }


    function getStartOfMonth() {

        const date = getToday();

        date.setDate(1);

        return date;

    }


    function parseActivityDate(value) {

        if (!value) {
            return null;
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return null;
        }

        return date;

    }


    /* =========================================
       DATE FILTER
       ========================================= */

    function matchesDateFilter(
        item
    ) {

        if (!dateFilter) {
            return true;
        }

        const selectedDate =
            normalize(
                dateFilter.value
            );

        if (!selectedDate) {
            return true;
        }

        const date =
            parseActivityDate(
                item.dataset.date
            );

        if (!date) {
            return false;
        }

        const today =
            getToday();


        if (selectedDate === "today") {

            return (
                date.getFullYear() ===
                    today.getFullYear() &&

                date.getMonth() ===
                    today.getMonth() &&

                date.getDate() ===
                    today.getDate()
            );

        }


        if (selectedDate === "yesterday") {

            const yesterday =
                new Date(today);

            yesterday.setDate(
                yesterday.getDate() - 1
            );

            return (
                date.getFullYear() ===
                    yesterday.getFullYear() &&

                date.getMonth() ===
                    yesterday.getMonth() &&

                date.getDate() ===
                    yesterday.getDate()
            );

        }


        if (selectedDate === "week") {

            const startOfWeek =
                getStartOfWeek();

            return date >= startOfWeek;

        }


        if (selectedDate === "month") {

            const startOfMonth =
                getStartOfMonth();

            return date >= startOfMonth;

        }


        return true;

    }


    /* =========================================
       FILTER MATCHING
       ========================================= */

    function matchesFilters(
        item
    ) {

        const search =
            searchInput
                ? normalize(
                    searchInput.value
                )
                : "";


        const type =
            typeFilter
                ? normalize(
                    typeFilter.value
                )
                : "";


        const user =
            userFilter
                ? normalize(
                    userFilter.value
                )
                : "";


        const action =
            actionFilter
                ? normalize(
                    actionFilter.value
                )
                : "";


        const itemSearch =
            normalize(
                item.dataset.search ||
                item.textContent
            );


        const itemType =
            normalize(
                item.dataset.type
            );


        const itemUser =
            normalize(
                item.dataset.user
            );


        const itemAction =
            normalize(
                item.dataset.action
            );


        const matchesSearch =
            !search ||
            itemSearch.includes(
                search
            );


        const matchesType =
            !type ||
            itemType === type;


        const matchesUser =
            !user ||
            itemUser === user;


        const matchesAction =
            !action ||
            itemAction === action;


        const matchesDate =
            matchesDateFilter(
                item
            );


        return (
            matchesSearch &&
            matchesType &&
            matchesUser &&
            matchesAction &&
            matchesDate
        );

    }


    /* =========================================
       BUILD FILTERED LIST
       ========================================= */

    function buildFilteredLists() {

        filteredTimelineItems =
            timelineItems.filter(
                matchesFilters
            );


        filteredTableRows =
            tableRows.filter(
                matchesFilters
            );

    }


    /* =========================================
       UPDATE COUNT
       ========================================= */

    function updateActivityCount() {

        if (!activityCount) {
            return;
        }

        activityCount.textContent =
            filteredTimelineItems.length;

    }


    /* =========================================
       PAGINATION
       ========================================= */

    function getTotalPages() {

        return Math.max(
            1,
            Math.ceil(
                filteredTimelineItems.length /
                ITEMS_PER_PAGE
            )
        );

    }


    function createPaginationButtons() {

        if (!paginationPages) {
            return;
        }

        paginationPages.innerHTML = "";

        const totalPages =
            getTotalPages();


        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "pagination-page";

            button.dataset.page =
                page;

            button.textContent =
                page;


            if (
                page === currentPage
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.addEventListener(
                "click",
                function () {

                    currentPage =
                        Number(
                            button.dataset.page
                        );

                    renderCurrentPage();

                }
            );


            paginationPages.appendChild(
                button
            );

        }

    }


    function renderCurrentPage() {

        const totalPages =
            getTotalPages();


        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;

        }


        if (
            currentPage < 1
        ) {

            currentPage = 1;

        }


        const start =
            (
                currentPage - 1
            ) *
            ITEMS_PER_PAGE;


        const end =
            start +
            ITEMS_PER_PAGE;


        const visibleItems =
            filteredTimelineItems.slice(
                start,
                end
            );


        /* Hide all timeline items */

        timelineItems.forEach(
            function (item) {

                item.style.display =
                    "none";

            }
        );


        /* Show current page */

        visibleItems.forEach(
            function (item) {

                item.style.display =
                    "flex";

            }
        );


        /* Update table */

        tableRows.forEach(
            function (row) {

                row.style.display =
                    "none";

            }
        );


        const visibleRows =
            filteredTableRows.slice(
                start,
                end
            );


        visibleRows.forEach(
            function (row) {

                row.style.display =
                    "";

            }
        );


        updatePaginationButtons();

        createPaginationButtons();

    }


    function updatePaginationButtons() {

        const totalPages =
            getTotalPages();


        if (previousPage) {

            previousPage.disabled =
                currentPage <= 1;

        }


        if (nextPage) {

            nextPage.disabled =
                currentPage >=
                totalPages;

        }

    }


    /* =========================================
       NO RESULTS STATE
       ========================================= */

    function updateNoResults() {

        if (!noResults) {
            return;
        }


        noResults.style.display =
            filteredTimelineItems.length === 0
                ? "block"
                : "none";

    }


    /* =========================================
       APPLY FILTERS
       ========================================= */

    function applyFilters() {

        buildFilteredLists();

        currentPage = 1;

        updateActivityCount();

        updateNoResults();

        renderCurrentPage();

    }


    /* =========================================
       SEARCH
       ========================================= */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    /* =========================================
       TYPE
       ========================================= */

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =========================================
       USER
       ========================================= */

    if (userFilter) {

        userFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =========================================
       ACTION
       ========================================= */

    if (actionFilter) {

        actionFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =========================================
       DATE
       ========================================= */

    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =========================================
       PREVIOUS PAGE
       ========================================= */

    if (previousPage) {

        previousPage.addEventListener(
            "click",
            function () {

                if (
                    currentPage <= 1
                ) {
                    return;
                }


                currentPage--;

                renderCurrentPage();

            }
        );

    }


    /* =========================================
       NEXT PAGE
       ========================================= */

    if (nextPage) {

        nextPage.addEventListener(
            "click",
            function () {

                const totalPages =
                    getTotalPages();


                if (
                    currentPage >=
                    totalPages
                ) {
                    return;
                }


                currentPage++;

                renderCurrentPage();

            }
        );

    }


    /* =========================================
       EXPORT ACTIVITY LOG
       ========================================= */

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            function () {

                const rows =
                    filteredTableRows.length
                        ? filteredTableRows
                        : tableRows;


                if (!rows.length) {

                    alert(
                        "There is no activity data to export."
                    );

                    return;

                }


                const csvRows = [];


                csvRows.push([
                    "Date & Time",
                    "Activity",
                    "Description",
                    "Type",
                    "User",
                    "Status"
                ]);


                rows.forEach(
                    function (row) {

                        const cells =
                            row.querySelectorAll(
                                "td"
                            );


                        if (
                            cells.length < 5
                        ) {
                            return;
                        }


                        const date =
                            cells[0]
                                .textContent
                                .trim();


                        const activity =
                            cells[1]
                                ?.querySelector(
                                    "strong"
                                )
                                ?.textContent
                                .trim()
                            || "";


                        const description =
                            cells[1]
                                ?.querySelector(
                                    "span"
                                )
                                ?.textContent
                                .trim()
                            || "";


                        const type =
                            cells[2]
                                .textContent
                                .trim();


                        const user =
                            cells[3]
                                .textContent
                                .trim();


                        const status =
                            cells[4]
                                .textContent
                                .trim();


                        csvRows.push([
                            date,
                            activity,
                            description,
                            type,
                            user,
                            status
                        ]);

                    }
                );


                const csvContent =
                    csvRows
                        .map(
                            function (row) {

                                return row
                                    .map(
                                        function (value) {

                                            const text =
                                                String(
                                                    value || ""
                                                ).replace(
                                                    /"/g,
                                                    '""'
                                                );

                                            return `"${text}"`;

                                        }
                                    )
                                    .join(",");

                            }
                        )
                        .join("\n");


                const blob =
                    new Blob(
                        [csvContent],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href = url;

                link.download =
                    "InCraft_Activity_Log.csv";


                document.body.appendChild(
                    link
                );


                link.click();

                document.body.removeChild(
                    link
                );


                URL.revokeObjectURL(
                    url
                );

            }
        );

    }


    /* =========================================
       INITIALIZE
       ========================================= */

    applyFilters();

});