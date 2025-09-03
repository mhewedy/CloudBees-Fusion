document.addEventListener('DOMContentLoaded', () => {
    const redirectToggle = document.getElementById('toggleRedirect');
    const linkTransformToggle = document.getElementById('toggleLinkTransform');

    // Load saved state
    chrome.storage.sync.get(['redirectEnabled', 'linkTransformEnabled'], (result) => {
        redirectToggle.checked = result.redirectEnabled !== false; // Default to true
        linkTransformToggle.checked = result.linkTransformEnabled !== false; // Default to true
    });

    // Save state when changed
    redirectToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ redirectEnabled: redirectToggle.checked });
    });

    linkTransformToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ linkTransformEnabled: linkTransformToggle.checked });
    });
});