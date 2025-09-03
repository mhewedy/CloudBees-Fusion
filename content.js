// Function to handle Pipeline Explorer redirection
function handlePipelineRedirect() {
    // Check if we're on a Jenkins job page without the pipeline explorer
    const currentUrl = window.location.href;
    const urlPattern = /https:\/\/([^\/]+)(?:\/view\/.*)?\/job\/([^\/]+)\/job\/([^\/]+)\/?$/;

    if (urlPattern.test(currentUrl)) {
        // Check if redirect is enabled
        chrome.storage.sync.get(['redirectEnabled'], (result) => {
            const redirectEnabled = result.redirectEnabled !== false; // Default to true

            if (redirectEnabled && !sessionStorage.getItem('cancelRedirect')) {
                // Create a notification UI
                const notification = document.createElement('div');
                notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px;
          border-radius: 5px;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          font-family: Arial, sans-serif;
          max-width: 300px;
        `;

                notification.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px;">Pipeline Explorer Redirect</div>
          <div style="margin-bottom: 12px;">Redirecting to Pipeline Explorer...</div>
          <button id="cancelRedirect" style="
            background: white;
            color: #4CAF50;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
          ">Cancel</button>
        `;

                document.body.appendChild(notification);

                // Add event listener for cancel button
                document.getElementById('cancelRedirect').addEventListener('click', () => {
                    notification.remove();
                    // Store a flag to prevent redirect for this session
                    sessionStorage.setItem('cancelRedirect', 'true');
                });

                // Redirect after delay
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        const match = currentUrl.match(urlPattern);
                        if (match) {
                            const [_, domain, project, branch] = match;
                            window.location.href = `https://${domain}/view/DEV/job/${project}/job/${branch}/lastBuild/cloudbees-pipeline-explorer/`;
                        }
                    }
                }, 500);
            }
        });
    }
}

// Function to transform the Jenkins link
function transformJenkinsLink() {
    // Check if link transformation is enabled
    chrome.storage.sync.get(['linkTransformEnabled'], (result) => {
        const linkTransformEnabled = result.linkTransformEnabled !== false; // Default to true

        if (linkTransformEnabled) {
            // Find the target link - search in both light DOM and shadow DOM
            const link = document.querySelector("#cloudbees-log-viewer")
                .shadowRoot.querySelector("#wrapper > div > section > cloudbees-log-viewer-log-bar")
                .shadowRoot.querySelector("#input-step-alert > md-outlined-button")
                .shadowRoot.querySelector("#link")

            if (!link) {
                console.log('Target link not found');
                return;
            }

            // Store original HTML and attributes
            const originalHtml = link.innerHTML;
            const originalHref = link.href;
            const parent = link.parentNode;

            // Create replacement button
            const button = document.createElement('button');
            button.id = 'jenkins-popup-trigger';
            button.className = 'button jenkins-popup-button';
            button.innerHTML = originalHtml;

            // Copy all attributes from the original link
            for (let i = 0; i < link.attributes.length; i++) {
                const attr = link.attributes[i];
                if (attr.name !== 'href' && attr.name !== 'id') {
                    button.setAttribute(attr.name, attr.value);
                }
            }

            // Add event listener to the new button
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showPopupForm(originalHref);
            });

            // Replace the link with the button
            parent.replaceChild(button, link);
        }
    });
}

// Function to show the popup form
function showPopupForm(originalHref) {
    // Get Jenkins Crumb from the page
    const jenkinsCrumbElement = document.querySelector('input[name="Jenkins-Crumb"]');
    const jenkinsCrumb = jenkinsCrumbElement ? jenkinsCrumbElement.value : '';

    // Create popup overlay
    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'jenkins-popup-overlay';
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 400px;
    max-width: 90%;
  `;

    // Create the form
    popupContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
      <div style="font-weight: bold; font-size: 18px;">Deploy to QA</div>
      <button id="jenkins-popup-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">&times;</button>
    </div>
    <div>
      <p>Are you sure you want to proceed with deployment to QA?</p>
      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button id="proceed-btn" class="jenkins-button jenkins-submit-button jenkins-button--primary">
          Proceed
        </button>
        <button id="abort-btn" class="jenkins-button jenkins-submit-button jenkins-button--primary">
          Abort
        </button>
      </div>
    </div>
  `;

    // Add to page
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);

    // Build the correct action URL
    const url = new URL(originalHref);
    let path = url.pathname;
    if (path.includes('../')) {
        path = path.replace('../', '');
    }
    const actionUrl = `${url.origin}${path}/Deploy-QA/submit`;

    // Add event listeners to buttons
    document.getElementById('proceed-btn').addEventListener('click', function() {
        submitForm(actionUrl, jenkinsCrumb, 'proceed', 'Proceed');
        document.body.removeChild(popupOverlay);
    });

    document.getElementById('abort-btn').addEventListener('click', function() {
        submitForm(actionUrl, jenkinsCrumb, 'abort', 'Abort');
        document.body.removeChild(popupOverlay);
    });

    // Add close functionality
    document.getElementById('jenkins-popup-close').addEventListener('click', function() {
        document.body.removeChild(popupOverlay);
    });

    // Close when clicking outside
    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            document.body.removeChild(popupOverlay);
        }
    });

    // Function to submit the form using Fetch API
    function submitForm(url, crumb, action, value) {
        // Create the JSON object that Jenkins expects
        const jsonData = {
            "proceed": "",
            "abort": "",
            "Jenkins-Crumb": crumb
        };

        // Create URLSearchParams for form data
        const formData = new URLSearchParams();
        formData.append(action, ""); // Empty value for the button
        formData.append('Jenkins-Crumb', crumb);
        formData.append('json', JSON.stringify(jsonData));

        // Add all the necessary headers that Jenkins expects
        const headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'max-age=0',
            'Origin': window.location.origin,
            'Referer': window.location.href,
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        };

        fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData.toString(),
            credentials: 'include', // Include cookies for authentication
            redirect: 'manual' // Handle redirects manually
        })
            .then(response => {
                if (response.status === 302 || response.status === 303) {
                    // Jenkins returns a redirect on success
                    console.log(`${action} action successful, redirecting...`);
                    window.location.href = response.headers.get('Location') || window.location.href;
                } else if (response.ok || response.status === 0) {
                    console.log(`${action} action successful`);
                    window.location.reload();
                } else {
                    console.error(`Error with ${action} action:`, response.status, response.statusText);
                    return response.text().then(text => {
                        console.error('Response text:', text);
                        alert(`Error: ${response.status} ${response.statusText}`);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing your request.');
            });
    }
}

// Initialize when page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        handlePipelineRedirect();
        // Add a small delay to ensure all shadow DOM elements are loaded
        setTimeout(transformJenkinsLink, 1000);
    });
} else {
    handlePipelineRedirect();
    // Add a small delay to ensure all shadow DOM elements are loaded
    setTimeout(transformJenkinsLink, 1000);
}
