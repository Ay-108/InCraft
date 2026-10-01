/* =========================================
   InCraft — Analytics JavaScript
   static/js/analytics.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. CHART DATA
       ========================================= */

    const revenueLabels =
        window.analyticsRevenueLabels || [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun"
        ];


    const revenueData =
        window.analyticsRevenueData || [
            45000,
            52000,
            48000,
            61000,
            68000,
            75000
        ];


    const salesData =
        window.analyticsSalesData || [
            120,
            145,
            132,
            168,
            190,
            215
        ];


    const categoryLabels =
        window.analyticsCategoryLabels || [
            "Electronics",
            "Clothing",
            "Food",
            "Stationery",
            "Other"
        ];


    const categoryData =
        window.analyticsCategoryData || [
            35,
            25,
            20,
            12,
            8
        ];


    /* =========================================
       2. REVENUE CHART
       ========================================= */

    const revenueCanvas =
        document.getElementById(
            "analyticsRevenueChart"
        );


    if (
        revenueCanvas &&
        typeof Chart !== "undefined"
    ) {

        new Chart(
            revenueCanvas,
            {
                type: "line",

                data: {

                    labels: revenueLabels,

                    datasets: [

                        {
                            label: "Revenue",

                            data: revenueData,

                            borderColor: "#f47521",

                            backgroundColor:
                                "rgba(244, 117, 33, 0.08)",

                            borderWidth: 2,

                            fill: true,

                            tension: 0.4,

                            pointRadius: 3,

                            pointHoverRadius: 5

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                callback:
                                    function (value) {

                                        return "₹" +
                                            Number(value)
                                                .toLocaleString(
                                                    "en-IN"
                                                );

                                    }

                            }

                        }

                    }

                }

            }
        );

    }


    /* =========================================
       3. SALES TREND CHART
       ========================================= */

    const salesCanvas =
        document.getElementById(
            "salesTrendChart"
        );


    if (
        salesCanvas &&
        typeof Chart !== "undefined"
    ) {

        new Chart(
            salesCanvas,
            {
                type: "bar",

                data: {

                    labels: revenueLabels,

                    datasets: [

                        {
                            label: "Sales",

                            data: salesData,

                            backgroundColor: "#f47521",

                            borderRadius: 5

                        }

                    ]

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
                            beginAtZero: true
                        }

                    }

                }

            }
        );

    }


    /* =========================================
       4. CATEGORY PERFORMANCE
       ========================================= */

    const categoryCanvas =
        document.getElementById(
            "categoryPerformanceChart"
        );


    if (
        categoryCanvas &&
        typeof Chart !== "undefined"
    ) {

        new Chart(
            categoryCanvas,
            {
                type: "doughnut",

                data: {

                    labels: categoryLabels,

                    datasets: [

                        {
                            data: categoryData,

                            backgroundColor: [
                                "#f47521",
                                "#555555",
                                "#888888",
                                "#aaaaaa",
                                "#d0d0d0"
                            ],

                            borderWidth: 0

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "60%",

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
       5. DATE FILTER
       ========================================= */

    const analyticsDateFilter =
        document.getElementById(
            "analyticsDateFilter"
        );


    const analyticsStartDate =
        document.getElementById(
            "analyticsStartDate"
        );


    const analyticsEndDate =
        document.getElementById(
            "analyticsEndDate"
        );


    function updateDateInputs() {

        if (!analyticsDateFilter) {
            return;
        }


        const selected =
            analyticsDateFilter.value;


        /*
         * Preset ranges are currently frontend-only.
         * Flask/MySQL integration will provide the
         * actual filtered analytics later.
         */

        if (selected === "custom") {

            if (analyticsStartDate) {
                analyticsStartDate.disabled = false;
            }

            if (analyticsEndDate) {
                analyticsEndDate.disabled = false;
            }

        } else {

            if (analyticsStartDate) {
                analyticsStartDate.disabled = true;
            }

            if (analyticsEndDate) {
                analyticsEndDate.disabled = true;
            }

        }

    }


    if (analyticsDateFilter) {

        analyticsDateFilter.addEventListener(
            "change",
            updateDateInputs
        );

    }


    /* =========================================
       6. APPLY FILTER
       ========================================= */

    const applyAnalyticsFilter =
        document.getElementById(
            "applyAnalyticsFilter"
        );


    if (applyAnalyticsFilter) {

        applyAnalyticsFilter.addEventListener(
            "click",
            function () {

                const filter =
                    analyticsDateFilter
                        ? analyticsDateFilter.value
                        : "";


                console.log(
                    "Analytics filter:",
                    filter
                );


                /*
                 * Later:
                 *
                 * fetch(
                 *     "/api/analytics?range=" + filter
                 * )
                 *
                 * will retrieve filtered
                 * MySQL analytics data.
                 */

            }
        );

    }


    /* =========================================
       7. KPI NUMBER FORMATTING
       ========================================= */

    const kpiValues =
        document.querySelectorAll(
            "[data-kpi]"
        );


    kpiValues.forEach(
        function (element) {

            const value =
                Number(
                    element.dataset.kpi
                );


            if (Number.isNaN(value)) {
                return;
            }


            element.textContent =
                value.toLocaleString(
                    "en-IN"
                );

        }
    );


    /* =========================================
       8. REVENUE FORMAT
       ========================================= */

    const revenueValues =
        document.querySelectorAll(
            "[data-revenue]"
        );


    revenueValues.forEach(
        function (element) {

            const value =
                Number(
                    element.dataset.revenue
                );


            if (Number.isNaN(value)) {
                return;
            }


            element.textContent =
                "₹" +
                value.toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }
                );

        }
    );


    /* =========================================
       9. EXPORT ANALYTICS
       ========================================= */

    const exportAnalytics =
        document.getElementById(
            "exportAnalytics"
        );


    if (exportAnalytics) {

        exportAnalytics.addEventListener(
            "click",
            function () {

                alert(
                    "Analytics export will be connected to Flask later."
                );

            }
        );

    }


    /* =========================================
       10. PRINT ANALYTICS
       ========================================= */

    const printAnalytics =
        document.getElementById(
            "printAnalytics"
        );


    if (printAnalytics) {

        printAnalytics.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }


    /* =========================================
       11. REFRESH ANALYTICS
       ========================================= */

    const refreshAnalytics =
        document.getElementById(
            "refreshAnalytics"
        );


    if (refreshAnalytics) {

        refreshAnalytics.addEventListener(
            "click",
            function () {

                refreshAnalytics.disabled = true;

                refreshAnalytics.textContent =
                    "Refreshing...";


                window.location.reload();

            }
        );

    }


    /* =========================================
       12. INITIAL STATE
       ========================================= */

    updateDateInputs();


    document.body.classList.add(
        "analytics-ready"
    );

});