/** @file tracker-sync/chrome-extension/content.js  */
function updateTitle() {
    try {
        const selectors = [
            'header span[dir="auto"]._ao3e',
            'header span._ao3e',
            'header span[dir="auto"].x1iyjqo2',
            'header [data-testid="conversation-header"] span[dir="auto"]',
            'header div[role="button"] span[dir="auto"]',
            'header span[dir="auto"]'
        ];

        let chatName = null;

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            const text = element?.textContent?.trim();

            if (text && text.length > 0 && text.length < 100) {
                chatName = text;
                break;
            }
        }

        if (chatName) {
            const newTitle = `WhatsApp: ${chatName}`;
            if (document.title !== newTitle) {
                document.title = newTitle;
            }
        }
    } catch (err) {
        console.error("[WA Title] Error:", err);
    }
}

// Debounce (avoid excessive updates)
let updateTimeout;
function debouncedUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateTitle, 100);
}

const observer = new MutationObserver(() => {
    debouncedUpdate();
});

function init() {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    updateTitle();

    // Retry periodically (for first 30sec)
    let attempts = 0;
    const retryInterval = setInterval(() => {
        attempts++;
        updateTitle();
        if (attempts >= 10) {
            clearInterval(retryInterval);
        }
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateTitle();
    }
});