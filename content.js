// Check if we're on a Jenkins job page without the pipeline explorer
const currentUrl = window.location.href;
const urlPattern = /https:\/\/([^\/]+)\/view\/DEV\/job\/([^\/]+)\/job\/([^\/]+)\/?$/;

if (urlPattern.test(currentUrl)) {
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
  
  // Only redirect if not canceled
  if (!sessionStorage.getItem('cancelRedirect')) {
    setTimeout(() => {
      if (document.body.contains(notification)) {
        const match = currentUrl.match(urlPattern);
        if (match) {
          const [_, domain, project, branch] = match;
          window.location.href = `https://${domain}/view/DEV/job/${project}/job/${branch}/lastBuild/cloudbees-pipeline-explorer/`;
        }
      }
    }, 2000);
  }
}