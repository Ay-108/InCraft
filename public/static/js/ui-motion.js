/* ============================================================
   InCraft — Motion Layer
   Additive presentation only. Does not modify application state,
   routes, forms, search, settings values or business logic.
   ============================================================ */
(function () {
    "use strict";

    function initializeMotionLayer() {
        var reducedMotion = false;

        try {
            reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;
        } catch (error) {
            reducedMotion = false;
        }

        if (reducedMotion) {
            return;
        }

        var selector = [
            ".page-header",
            ".dashboard-stats > .stat-card",
            ".dashboard-charts > *",
            ".dashboard-lower-grid > *",
            ".smart-insights-section",
            ".ml-inventory-panel",
            ".inventory-overview > *",
            ".inventory-card",
            ".inventory-table-card",
            ".sales-overview > *",
            ".sales-filter-card",
            ".sales-table-card",
            ".analytics-kpi-grid > *",
            ".analytics-main-grid > *",
            ".analytics-secondary-grid > *",
            ".activity-filter-panel",
            ".activity-stats-grid > *",
            ".activity-panel",
            ".settings-nav",
            ".settings-section",
            ".product-form",
            ".login-card"
        ].join(",");

        var elements = Array.prototype.slice.call(
            document.querySelectorAll(selector)
        );

        if (!elements.length) {
            return;
        }

        var uniqueElements = [];
        var seen = new Set();

        elements.forEach(function (element) {
            if (!seen.has(element)) {
                seen.add(element);
                uniqueElements.push(element);
            }
        });

        if (!("IntersectionObserver" in window)) {
            uniqueElements.forEach(function (element) {
                element.setAttribute("data-ui-motion", "visible");
            });
            return;
        }

        document.documentElement.classList.add("motion-ready");

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    var element = entry.target;
                    element.setAttribute("data-ui-motion", "visible");
                    observer.unobserve(element);
                });
            },
            {
                root: null,
                rootMargin: "0px 0px -28px 0px",
                threshold: 0.06
            }
        );

        uniqueElements.forEach(function (element, index) {
            element.style.transitionDelay = Math.min(index % 5, 4) * 55 + "ms";
            element.setAttribute("data-ui-motion", "pending");
            observer.observe(element);
        });

        // Make sure dynamically inserted modal content is not hidden by the
        // entrance layer; interactive overlays continue using their own state.
        document.addEventListener("shown.bs.modal", function (event) {
            if (event.target) {
                event.target.setAttribute("data-ui-motion", "visible");
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeMotionLayer, {
            once: true
        });
    } else {
        initializeMotionLayer();
    }
})();
