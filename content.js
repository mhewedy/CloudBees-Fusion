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
                ?.shadowRoot?.querySelector("#wrapper > div > section > cloudbees-log-viewer-log-bar")
                ?.shadowRoot?.querySelector("#input-step-alert > md-outlined-button")
                ?.shadowRoot?.querySelector("#link")

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
          Deploy
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
          background: #d10374;
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

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === "Escape") {
            popupOverlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });

    // Build the correct action URL
    const url = new URL(originalHref);
    let path = url.pathname;
    if (path.includes('../')) {
        path = path.replace('../', '');
    }
    const actionUrl = `${url.origin}${path}/Deploy-QA/submit`;      // TODO read stage (Deploy-QA) dynamically

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

// Function to add restart popup to the "Restart from Stage" button
function addRestartPopup() {
    // Check if we're on the pipeline explorer page
    if (!window.location.href.includes('/cloudbees-pipeline-explorer/')) {
        return;
    }

    // Look for all anchor tags that contain #<number> text and have the chevron button
    const anchorTags = document.querySelectorAll('a.model-link');

    let chevronButton = null;

    anchorTags.forEach(anchor => {
        // Check if the anchor text matches # followed by numbers (like #1230)
        if (anchor.textContent.match(/#\d+/)) {
            // Find the chevron button inside this anchor
            const chevron = anchor.querySelector('button.jenkins-menu-dropdown-chevron[data-href]');
            if (chevron) {
                chevronButton = chevron;
            }
        }
    });

    if (!chevronButton) {
        console.log('Chevron button not found');
        return;
    }

    console.log('Chevron button found, adding restart popup functionality');

    // Add click event listener to the chevron button
    chevronButton.addEventListener('click', function(e) {
        // Let the original click behavior happen first (open the dropdown menu)
        setTimeout(() => {
            console.log('Chevron button clicked, adding restart popup functionality');

            // Look for the "Restart from Stage" button
            const restartButtons = document.querySelectorAll('button, a');
            let restartButton = null;

            restartButtons.forEach(btn => {
                if (btn.textContent.trim() === 'Restart from Stage') {
                    restartButton = btn;
                }
            });

            if (!restartButton) {
                console.log('Restart from Stage button not found');
                return;
            }

            // Replace the button functionality
            restartButton.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showRestartPopup();
            };

            // Remove href if it's an anchor tag
            if (restartButton.tagName === 'A') {
                restartButton.href = 'javascript:void(0);';
            }

            console.log('Restart popup functionality added');
        }, 50);
    });
}

// Function to show the restart popup
function showRestartPopup() {
    const baseURL = window.location.href.split('/cloudbees-pipeline-explorer/')[0];
    const restartURL = `${baseURL}/restart/`;

    // Create popup overlay
    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'restart-popup-overlay';
    popupOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(2px);
    `;

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.style.cssText = `
         background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        width: 50%;
        height: 40%;
        max-width: 800px;
        max-height: 500px;
        min-width: 600px;
        min-height: 400px;
        overflow: hidden;
        animation: slideUp 0.3s ease;
        display: flex;
        flex-direction: column;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px 24px;
        border-bottom: 1px solid #e8e8e8;
        background: #fafafa;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <h2 style="margin: 0; color: #333; font-size: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">🔄</span>
            Restart Pipeline
        </h2>
        <button id="close-restart-popup" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        ">&times;</button>
    `;

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
        flex: 1;
        padding: 0;
    `;

    // Create loading indicator
    contentArea.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                <div>Loading restart page...</div>
            </div>
        </div>
    `;

    // Assemble popup
    popupContent.appendChild(header);
    popupContent.appendChild(contentArea);
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);

    // Load the restart page content
    fetch(restartURL)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainPanel = doc.getElementById('main-panel');

            if (mainPanel) {
                contentArea.innerHTML = '';

                // Clone and style the main-panel content
                const clonedContent = mainPanel.cloneNode(true);

                // Style the content to fit better in popup
                clonedContent.style.padding = '20px';
                clonedContent.style.maxHeight = 'none';

                contentArea.appendChild(clonedContent);

                // Add custom styles for the popup content
                const style = document.createElement('style');
                style.textContent = `
                    #restart-popup-overlay #main-panel {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    #restart-popup-overlay table {
                        width: 100% !important;
                    }
                    #restart-popup-overlay .form-container {
                        max-width: 100% !important;
                    }
                `;
                contentArea.appendChild(style);

                const jenkinsCrumbElement = document.querySelector('input[name="Jenkins-Crumb"]');
                const jenkinsCrumb = jenkinsCrumbElement ? jenkinsCrumbElement.value : '';

                contentArea.querySelectorAll('form').forEach(form => {
                    form.action = restartURL + "restart";

                    let crumbInput = document.createElement('input');
                    crumbInput.type = 'hidden';
                    crumbInput.name = 'Jenkins-Crumb';
                    crumbInput.value = jenkinsCrumb;
                    form.appendChild(crumbInput);

                    let jsonInput = document.createElement('input');
                    jsonInput.type = 'hidden';
                    jsonInput.id = 'json';
                    jsonInput.name = 'json';
                    form.appendChild(jsonInput);
                })

                // Auto-select the last option in dropdowns
                setTimeout(() => {
                    const dropdowns = contentArea.querySelectorAll('.jenkins-select__input');
                    dropdowns.forEach(dropdown => {
                        if (dropdown.options.length > 0) {
                            dropdown.addEventListener('change', function() {
                                contentArea.querySelector('#json').value = `{"stageName":"${dropdown.value}","Submit":"","Jenkins-Crumb":"${jenkinsCrumb}"}`;
                            })

                            // Select the last option
                            dropdown.selectedIndex = dropdown.options.length - 1;

                            // Trigger change event in case there are event listeners
                            const event = new Event('change', { bubbles: true });
                            dropdown.dispatchEvent(event);
                        }
                    });
                }, 100);

            } else {
                contentArea.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                        <div>Unable to load restart page content</div>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading restart page:', error);
            contentArea.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <div>Error loading restart page</div>
                    <div style="font-size: 12px; margin-top: 10px;">${error.message}</div>
                </div>
            `;
        });

    // Close functionality
    document.getElementById('close-restart-popup').addEventListener('click', function() {
        document.body.removeChild(popupOverlay);
    });

    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            document.body.removeChild(popupOverlay);
        }
    });

    // Escape key to close
    const handleEscape = function(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(popupOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function checkIsLatestBuild() {
    // Check if we're on the pipeline explorer page
    if (!window.location.href.includes('/cloudbees-pipeline-explorer/')) {
        return;
    }

    const baseURL = window.location.href.replace(/\/(\d+|lastBuild)\/cloudbees-pipeline-explorer\/.*/, '/');
    const url = `${baseURL}/buildHistory/ajax?search=`;

    fetch(url, {
        method: 'GET',
        credentials: 'include', // include cookies if needed
        headers: {
            'Accept': 'text/html',
        },
    })
        .then(response => response.text())
        .then(htmlString => {
            // Parse the HTML string
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            const builds = []
            const items = doc.querySelectorAll('.app-builds-container__item');

            items.forEach(item => {
                const id = item.getAttribute('page-entry-id');
                const linkElem = item.querySelector('.app-builds-container__item__inner__link');
                const numberMatch = linkElem?.textContent?.match(/#(\d+)/);
                const number = numberMatch ? numberMatch[1] : null;
                const statusIcon = item.querySelector('.app-builds-container__item__icon');
                let status = null;

                if (statusIcon) {
                    const tooltip = statusIcon.getAttribute('tooltip');
                    if (tooltip) status = tooltip;
                }
                builds.push({number, status});
            });

            if (!builds || builds.length === 0 ) {
                console.log('no builds found', builds)
                return;
            }

            const currentBuildNumber = (document.querySelector('title').text.match(/#(\d+)/) || [])[1] || null
            const currentBuildStatus = builds.find(build => build.number === currentBuildNumber).status;

            if (currentBuildStatus !== 'In progress') {
                console.log('current build is not in progress', currentBuildStatus)
                return;
            }

            if (Number(builds[0].number) === Number(currentBuildNumber)) {
                console.log('current build is the latest', builds[0].number, currentBuildNumber)
                return;
            }

            console.log('current build is not the latest', builds[0].number, currentBuildNumber)

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'build-popup-overlay';
            overlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

            let buildNumbers = Number(builds[0].number) - Number(currentBuildNumber);

            overlay.innerHTML = `
  <div style="
    background: #ffffff;
    border-radius: 12px;
    width: 420px;
    max-width: 90vw;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 15px;
    animation: slideUp 0.3s ease;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
  ">
    <div style="
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f0f0f0;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="display:inline-block; width:24px; height:24px;">
          <svg viewBox="0 0 24 24" fill="#d10374" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 21h22L12 2 1 21z"/>
            <path d="M12 16v2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 10v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <span style="font-weight: 600; font-size: 16px;">Build Alert</span>
      </div>
      <button id="build-popup-close" style="
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
      ">&times;</button>
    </div>

    <div style="padding: 20px 24px; font-size: 15px; color: #1a1a1a;">
      This is <b>not</b> the latest build.<br/>
      ${buildNumbers === 1 ?
                `A new build has been queued ...` :
                `There are ${buildNumbers} new builds queued ...`
            }
    </div>

    <div style="padding: 0 24px 20px; display:flex; justify-content:flex-end;">
      <button id="build-popup-ok" style="
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        background: #d10374;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      ">OK</button>
    </div>

    <style>
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      #build-popup-ok:hover {
        background: linear-gradient(135deg, #357abd, #2c5aa0);
        transform: translateY(-1px);
      }

      #build-popup-close:hover {
        background: #f7fafc;
        color: #4a5568;
      }

      #build-popup-close:active {
        transform: scale(0.95);
      }
    </style>
  </div>
`;

            document.body.appendChild(overlay);

            document.getElementById('build-popup-ok').addEventListener('click', () => overlay.remove());
            document.getElementById('build-popup-close').addEventListener('click', () => overlay.remove());

            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === "Escape") {
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            });

        })
        .catch(err => console.error('Error fetching builds:', err));
}

// Initialize when page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        handlePipelineRedirect();
        // Add a small delay to ensure all shadow DOM elements are loaded
        setTimeout(transformJenkinsLink, 500);
        setTimeout(addRestartPopup, 1000);
        setTimeout(checkIsLatestBuild, 1000);
    });
} else {
    handlePipelineRedirect();
    // Add a small delay to ensure all shadow DOM elements are loaded
    setTimeout(transformJenkinsLink, 500);
    setTimeout(addRestartPopup, 1000);
    setTimeout(checkIsLatestBuild, 1000);
}
