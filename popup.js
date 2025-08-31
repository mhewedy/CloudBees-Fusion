document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleEnabled');
  
  // Load saved state
  chrome.storage.sync.get(['enabled'], (result) => {
    toggle.checked = result.enabled !== false; // Default to true
  });
  
  // Save state when changed
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
  });
});