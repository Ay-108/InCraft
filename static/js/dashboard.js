/* =========================================
   InCraft — Dashboard JavaScript
   static/js/dashboard.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =========================================
       1. REVENUE CHART
       ========================================= */

    const revenueCanvas =
        document.getElementById("revenueChart");


    if (revenueCanvas && typeof Chart !== "undefined") {

        const revenueLabels =
            window.dashboardRevenueLabels || [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ];


        const revenueValues =
            window.dashboardRevenueData || [
                12000,
                18000,
                15000,
                22000,
                19000,
                26000,
                30000
            ];


        new Chart(
            revenueCanvas,
            {
                type: "line",

                data: {

                    labels: revenueLabels,

                    datasets: [{
                        label: "Revenue",

                        data: revenueValues,

                        borderColor: "#F0782B",

                        backgroundColor:
                            "rgba(240, 120, 43, 0.10)",

                        borderWidth: 2,

                        tension: 0.4,

                        fill: true,

                        pointRadius: 3,

                        pointHoverRadius: 5
                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                callback: function (value) {
                                    return "₹" + value;
                                }
                            }

                        }

                    }

                }

            }
        );

    }


    /* =========================================
       2. INVENTORY STATUS CHART
       ========================================= */

    const inventoryCanvas =
        document.getElementById(
            "inventoryChart"
        );


    if (
        inventoryCanvas &&
        typeof Chart !== "undefined"
    ) {

        const inventoryValues =
            window.dashboardInventoryData || [
                70,
                20,
                10
            ];


        new Chart(
            inventoryCanvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "In Stock",
                        "Low Stock",
                        "Out of Stock"
                    ],

                    datasets: [{

                        data: inventoryValues,

                        backgroundColor: [
                            "#F0782B",
                            "#A3A3A3",
                            "#2B2B2B"
                        ],

                        borderWidth: 0

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "65%",

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }

                }

            }
        );

    }


    /* =========================================
       3. REVENUE PERIOD FILTER
       ========================================= */

    const revenuePeriod =
        document.getElementById(
            "revenuePeriod"
        );


    if (revenuePeriod) {

        revenuePeriod.addEventListener(
            "change",
            function () {

                const period =
                    revenuePeriod.value;


                /*
                 * Backend integration can later
                 * retrieve the selected period from
                 * Flask/MySQL.
                 */

                console.log(
                    "Revenue period:",
                    period
                );

            }
        );

    }


    /* =========================================
       4. QUICK ACTION BUTTONS
       ========================================= */

    const addProductButton =
        document.getElementById(
            "dashboardAddProduct"
        );


    if (addProductButton) {

        addProductButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/inventory/add";

            }
        );

    }


    const recordSaleButton =
        document.getElementById(
            "dashboardRecordSale"
        );


    if (recordSaleButton) {

        recordSaleButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/sales";

            }
        );

    }


    /* =========================================
       5. LOW STOCK VIEW ALL
       ========================================= */

    const viewLowStock =
        document.getElementById(
            "viewLowStock"
        );


    if (viewLowStock) {

        viewLowStock.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/inventory?filter=low-stock";

            }
        );

    }


    /* =========================================
       6. DASHBOARD REFRESH
       ========================================= */

    const refreshDashboard =
        document.getElementById(
            "refreshDashboard"
        );


    if (refreshDashboard) {

        refreshDashboard.addEventListener(
            "click",
            function () {

                refreshDashboard.disabled = true;

                refreshDashboard.textContent =
                    "Refreshing...";


                window.location.reload();

            }
        );

    }


    /* =========================================
       7. RECENT ACTIVITY
       ========================================= */

    const activityItems =
        document.querySelectorAll(
            ".activity-item"
        );


    activityItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    const activityId =
                        item.dataset.activityId;


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
       8. DASHBOARD SEARCH
       ========================================= */

    const dashboardSearch =
        document.getElementById(
            "dashboardSearch"
        );


    if (dashboardSearch) {

        dashboardSearch.addEventListener(
            "input",
            function () {

                const query =
                    dashboardSearch.value
                        .trim()
                        .toLowerCase();


                const items =
                    document.querySelectorAll(
                        ".dashboard-search-item"
                    );


                items.forEach(
                    function (item) {

                        const text =
                            item.textContent
                                .toLowerCase();


                        item.style.display =
                            !query ||
                            text.includes(query)
                                ? ""
                                : "none";

                    }
                );

            }
        );

    }


    /* =========================================
       9. NUMBER ANIMATION
       ========================================= */

    const animatedNumbers =
        document.querySelectorAll(
            "[data-count]"
        );


    animatedNumbers.forEach(
        function (element) {

            const target =
                Number(
                    element.dataset.count
                );


            if (Number.isNaN(target)) {
                return;
            }


            let current = 0;

            const duration = 700;

            const steps = 30;

            const increment =
                target / steps;

            const interval =
                duration / steps;


            const counter =
                setInterval(
                    function () {

                        current += increment;


                        if (current >= target) {

                            current = target;

                            clearInterval(counter);

                        }


                        element.textContent =
                            Math.round(current)
                                .toLocaleString();

                    },
                    interval
                );

        }
    );


    /* =========================================
       10. SMART DECISION SUPPORT
       ========================================= */

    const analyzeInsightsButton =
        document.getElementById(
            "analyzeInsightsBtn"
        );

    const smartInsightsStatus =
        document.getElementById(
            "smartInsightsStatus"
        );

    const smartInsightsGrid =
        document.getElementById(
            "smartInsightsGrid"
        );

    const smartInsightsEmpty =
        document.getElementById(
            "smartInsightsEmpty"
        );


    /*
     * Update the status message displayed
     * above the Smart Decision Support cards.
     */
    function setInsightsStatus(
        message,
        type = ""
    ) {

        if (!smartInsightsStatus) {
            return;
        }


        smartInsightsStatus.textContent =
            message;


        smartInsightsStatus.className =
            "smart-insights-status";


        if (type) {
            smartInsightsStatus.classList.add(
                type
            );
        }

    }


    /*
     * Format numbers as Indian currency.
     */
    function formatCurrency(value) {

        const amount =
            Number(value) || 0;


        return "₹" +
            amount.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    /*
     * Format normal numbers.
     */
    function formatNumber(value) {

        return (
            Number(value) || 0
        ).toLocaleString("en-IN");

    }


    /*
     * Convert an insight priority into
     * a readable label.
     */
    function formatPriority(priority) {

        if (!priority) {
            return "";
        }


        return priority
            .charAt(0)
            .toUpperCase() +
            priority.slice(1);

    }


    /*
     * Update one Smart Insight card.
     */
    function updateInsightCard(insight) {

        if (!insight || !insight.type) {
            return;
        }


        if (!smartInsightsGrid) {
            return;
        }


        const card =
            smartInsightsGrid.querySelector(
                '[data-insight-type="' +
                insight.type +
                '"]'
            );


        if (!card) {
            return;
        }


        /*
         * Find common elements inside the card.
         */
        const message =
            card.querySelector(
                ".insight-message"
            );

        const metric =
            card.querySelector(
                ".insight-metric"
            );

        const priority =
            card.querySelector(
                ".insight-priority"
            );


        /*
         * Update message.
         */
        if (message && insight.message) {

            message.textContent =
                insight.message;

        }


        /*
         * Update metric.
         */
        if (metric && insight.metric !== undefined) {

            let metricValue =
                insight.metric;


            /*
             * Revenue/value related metrics
             * are displayed as currency.
             */
            if (
                insight.metric_type === "currency" ||
                insight.type === "revenue"
            ) {

                metricValue =
                    formatCurrency(
                        insight.metric
                    );

            } else {

                metricValue =
                    formatNumber(
                        insight.metric
                    );

            }


            metric.textContent =
                metricValue;

        }


        /*
         * Update priority.
         */
        if (priority) {

            const currentPriority =
                priority.dataset.priority;


            if (currentPriority) {

                priority.classList.remove(
                    "priority-high",
                    "priority-medium",
                    "priority-low"
                );

            }


            if (insight.priority) {

                priority.dataset.priority =
                    insight.priority;


                priority.classList.add(
                    "priority-" +
                    insight.priority
                );


                priority.textContent =
                    formatPriority(
                        insight.priority
                    );

            }

        }


        /*
         * Update card class based on
         * the insight severity.
         */
        card.classList.remove(
            "insight-warning",
            "insight-positive",
            "insight-danger",
            "insight-info",
            "insight-purple",
            "insight-neutral"
        );


        if (insight.style) {

            card.classList.add(
                "insight-" +
                insight.style
            );

        }

    }


    /*
     * Display the Smart Decision Support
     * results returned by Flask.
     */
    function displayInsights(insights) {

        if (!Array.isArray(insights)) {
            return;
        }


        if (
            smartInsightsGrid &&
            smartInsightsEmpty
        ) {

            smartInsightsGrid.style.display =
                "";

            smartInsightsEmpty.style.display =
                "none";

        }


        insights.forEach(
            function (insight) {

                updateInsightCard(
                    insight
                );

            }
        );

    }


    /*
     * Request Smart Decision Support
     * information from the Flask backend.
     */
    async function loadSmartInsights() {

        if (analyzeInsightsButton) {

            analyzeInsightsButton.disabled =
                true;

            analyzeInsightsButton.classList.add(
                "loading"
            );

        }


        setInsightsStatus(
            "Analyzing your inventory and sales data..."
        );


        try {

            const response =
                await fetch(
                    "/api/dashboard/insights",
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        },

                        credentials: "same-origin"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load smart insights."
                );

            }


            const data =
                await response.json();


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Smart analysis failed."
                );

            }


            displayInsights(
                data.insights || []
            );


            const generatedAt =
                data.generated_at;


            if (generatedAt) {

                setInsightsStatus(
                    "Analysis updated successfully."
                );

            } else {

                setInsightsStatus(
                    "Smart analysis completed."
                );

            }

        } catch (error) {

            console.error(
                "Smart Insights Error:",
                error
            );


            setInsightsStatus(
                error.message ||
                "Unable to load smart insights.",
                "error"
            );

        } finally {

            if (analyzeInsightsButton) {

                analyzeInsightsButton.disabled =
                    false;

                analyzeInsightsButton.classList.remove(
                    "loading"
                );

            }

        }

    }


    /*
     * Analyze Insights button.
     */
    if (analyzeInsightsButton) {

        analyzeInsightsButton.addEventListener(
            "click",
            loadSmartInsights
        );

    }


    /*
     * Automatically load Smart Decision
     * Support when the dashboard opens.
     *
     * This means the user does not have
     * to click Analyze every time.
     */
    if (
        smartInsightsGrid &&
        document.querySelector(
            ".insight-card"
        )
    ) {

        loadSmartInsights();

    }


    /*
     * Smart Insight action buttons.
     *
     * These currently provide useful navigation
     * to the relevant module. They do not alter
     * any database data directly.
     */
    const insightActions =
        document.querySelectorAll(
            ".insight-action"
        );


    insightActions.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const action =
                        button.dataset.action;


                    if (!action) {
                        return;
                    }


                    if (action === "inventory") {

                        window.location.href =
                            "/inventory";

                    }


                    else if (action === "sales") {

                        window.location.href =
                            "/sales";

                    }


                    else if (action === "analytics") {

                        window.location.href =
                            "/analytics";

                    }


                    else {

                        console.log(
                            "Insight action:",
                            action
                        );

                    }

                }
            );

        }
    );


    /* =========================================
       11. DASHBOARD READY
       ========================================= */

    document.body.classList.add(
        "dashboard-ready"
    );

});