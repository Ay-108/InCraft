/* =========================================================
   InCraft — Live module synchronization
   Keeps Dashboard, Inventory, Sales and Analytics aligned
   across open browser tabs without changing stored settings.
   ========================================================= */
(function () {
    "use strict";

    var STORAGE_KEY = "incraft:data-change:v1";
    var CHANNEL_NAME = "incraft-data-change-v1";
    var lastHandledId = null;
    var channel = null;

    function publishChange(reason) {
        var message = {
            id: String(Date.now()) + "-" + Math.random().toString(36).slice(2),
            reason: String(reason || "data"),
            timestamp: Date.now()
        };

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
        } catch (error) {
            // BroadcastChannel below remains available when storage is disabled.
        }

        if (channel) {
            try {
                channel.postMessage(message);
            } catch (error) {
                // The local page can continue without cross-tab messaging.
            }
        }

        return message;
    }

    function receiveChange(message) {
        if (!message || !message.id || message.id === lastHandledId) {
            return;
        }

        lastHandledId = message.id;
        window.dispatchEvent(new CustomEvent("incraft:data-changed", {
            detail: message
        }));
    }

    if ("BroadcastChannel" in window) {
        try {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.addEventListener("message", function (event) {
                receiveChange(event.data);
            });
        } catch (error) {
            channel = null;
        }
    }

    window.addEventListener("storage", function (event) {
        if (event.key !== STORAGE_KEY || !event.newValue) {
            return;
        }

        try {
            receiveChange(JSON.parse(event.newValue));
        } catch (error) {
            // Ignore malformed cross-tab messages.
        }
    });

    window.InCraftDataSync = Object.freeze({
        notifyChange: publishChange
    });

    // Flask sets this one-time marker after a successful form-based write.
    // Consuming it here notifies other tabs once, without modifying app settings.
    var pendingChange = document.body
        ? document.body.getAttribute("data-incraft-data-changed")
        : "";

    if (pendingChange) {
        document.body.removeAttribute("data-incraft-data-changed");
        publishChange(pendingChange);
    }

    window.addEventListener("incraft:data-changed", function () {
        var path = window.location.pathname.replace(/\/+$/, "") || "/";
        var connectedModules = [
            "/dashboard",
            "/inventory",
            "/sales",
            "/analytics"
        ];

        if (connectedModules.indexOf(path) === -1) {
            return;
        }

        // Do not discard an open sale or delete modal while the user is working.
        var saleModal = document.getElementById("saleModal");
        var deleteModal = document.getElementById("deleteModal");
        var modalIsOpen = [saleModal, deleteModal].some(function (modal) {
            return modal &&
                !modal.hidden &&
                modal.getAttribute("aria-hidden") !== "true";
        });

        if (modalIsOpen) {
            return;
        }

        window.location.reload();
    });
})();