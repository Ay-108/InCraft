/* =========================================================
   InCraft — Resilient Chart.js loader
   Uses a pinned Chart.js build and CDN failover so chart pages
   do not silently fail when one delivery host is unavailable.
   ========================================================= */
(function () {
    "use strict";

    if (window.Chart) {
        window.InCraftChartReady = Promise.resolve(true);
        return;
    }

    var sources = [
        "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js",
        "https://unpkg.com/chart.js@4.5.1/dist/chart.umd.min.js"
    ];

    window.InCraftChartReady = new Promise(function (resolve) {
        var index = 0;

        function tryNextSource() {
            if (window.Chart) {
                resolve(true);
                return;
            }

            if (index >= sources.length) {
                console.error("InCraft charts: all Chart.js delivery sources failed.");
                resolve(false);
                return;
            }

            var source = sources[index++];
            var script = document.createElement("script");
            var settled = false;
            var timeoutId = window.setTimeout(function () {
                finish(false);
            }, 6500);

            function finish(success) {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);

                if (success && window.Chart) {
                    resolve(true);
                    return;
                }

                script.onerror = null;
                script.onload = null;
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                tryNextSource();
            }

            script.src = source;
            script.async = true;
            script.crossOrigin = "anonymous";
            script.onload = function () {
                finish(!!window.Chart);
            };
            script.onerror = function () {
                finish(false);
            };

            document.head.appendChild(script);
        }

        tryNextSource();
    });
})();