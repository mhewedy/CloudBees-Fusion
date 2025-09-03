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
    background: #ffffff;
    padding: 0;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
    width: 420px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    animation: slideUp 0.3s ease;
  `;

    // Create the form with modern styling
    popupContent.innerHTML = `
    <div style="
      background: #ffffff;
      padding: 24px 24px 20px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    ">
      <div>
        <div style="
          font-weight: 600;
          font-size: 18px;
          color: #1a1a1a;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <span style="
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
          ">🚀</span>
          Deploy to QA
        </div>
      </div>
      <button id="jenkins-popup-close" style="
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        margin: -8px -8px 0 0;
      ">&times;</button>
    </div>
    
    <div style="padding: 24px;">
      
      <div style="
        background: linear-gradient(to right, #f7f9fc, #ffffff);
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
      ">
        <div style="
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 12px;
          font-size: 13px;
          color: #4a5568;
        ">
          <span style="font-weight: 500;">Status:</span>
          <span style="color: #38a169;">Ready for deployment</span>
          
          <span style="font-weight: 500;">Environment:</span>
          <span>QA</span>
          
          <span style="font-weight: 500;">Build:</span>
          <span>#${window.location.pathname.split('/').pop() || 'latest'}</span>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="abort-btn" style="
          padding: 10px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          color: #4a5568;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
          font-size: 14px;
        ">
          Abort
        </button>
        
        <button id="proceed-btn" style="
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #0063a6, #007acc);
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
          box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3);
          font-size: 14px;
        ">
          Deploy
        </button>
      </div>
    </div>
    
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      #abort-btn:hover {
        background: #f7fafc;
        border-color: #cbd5e0;
        transform: translateY(-1px);
      }
      
      #proceed-btn:hover {
        background: linear-gradient(135deg, #357abd, #2c5aa0);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(74, 144, 226, 0.4);
      }
      
      #jenkins-popup-close:hover {
        background: #f7fafc;
        color: #4a5568;
      }
      
      #jenkins-popup-close:active {
        transform: scale(0.95);
      }
    </style>
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
        setTimeout(transformJenkinsLink, 500);
    });
} else {
    handlePipelineRedirect();
    // Add a small delay to ensure all shadow DOM elements are loaded
    setTimeout(transformJenkinsLink, 500);
}
