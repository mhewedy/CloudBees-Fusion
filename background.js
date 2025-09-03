// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    // Check if redirect is enabled
    chrome.storage.sync.get(['redirectEnabled'], (result) => {
        const redirectEnabled = result.redirectEnabled !== false; // Default to true

        if (redirectEnabled) {
            // Check if the URL matches the Jenkins job pattern
            const urlPattern = /https:\/\/([^\/]+)(?:\/view\/.*)?\/job\/([^\/]+)\/job\/([^\/]+)\/?$/;
            const match = details.url.match(urlPattern);

            if (match) {
                const [_, domain, project, branch] = match;
                const newUrl = `https://${domain}/job/${project}/job/${branch}/lastBuild/cloudbees-pipeline-explorer/`;

                // Redirect to the Pipeline Explorer
                chrome.tabs.update(details.tabId, { url: newUrl });
            }
        }
    });
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Jenkins Enhanced Tools installed");

    // Set default values
    chrome.storage.sync.set({
        redirectEnabled: true,
        linkTransformEnabled: true
    });
});