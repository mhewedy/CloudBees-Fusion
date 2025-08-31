// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Check if the URL matches the Jenkins job pattern
  const urlPattern = /https:\/\/([^\/]+)\/view\/DEV\/job\/([^\/]+)\/job\/([^\/]+)\/?$/;
  const match = details.url.match(urlPattern);
  
  if (match) {
    const [_, domain, project, branch] = match;
    const newUrl = `https://${domain}/view/DEV/job/${project}/job/${branch}/lastBuild/cloudbees-pipeline-explorer/`;
    
    // Redirect to the Pipeline Explorer
    chrome.tabs.update(details.tabId, { url: newUrl });
  }
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Jenkins Pipeline Explorer Redirect installed");
});