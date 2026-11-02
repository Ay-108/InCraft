/* =========================================================
   InCraft — Resilient Chart.js loader
   Uses a pinned Chart.js build with parallel CDN failover so
   a chart page is not dependent on one delivery host.
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
        var settled = false;
        var failed = 0;
        var scripts = [];

        function finish(success) {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);

            if (!success) {
                scripts.forEach(function (script) {
                    script.onload = null;
                    script.onerror = null;
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                });
                console.error("InCraft charts: all Chart.js delivery sources failed.");
            }

            resolve(Boolean(success && window.Chart));
        }

        var timeoutId = window.setTimeout(function () {
            finish(Boolean(window.Chart));
        }, 6500);

        sources.forEach(function (source) {
            var script = document.createElement("script");
            scripts.push(script);
            script.src = source;
            script.async = true;
            script.crossOrigin = "anonymous";
            script.onload = function () {
                if (window.Chart) {
                    finish(true);
                } else {
                    failed += 1;
                    if (failed === sources.length) finish(false);
                }
            };
            script.onerror = function () {
                failed += 1;
                if (failed === sources.length) finish(false);
            };
            document.head.appendChild(script);
        });
    });
})();