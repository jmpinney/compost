document.addEventListener('DOMContentLoaded', async () => {
  const brokenLinksList = document.getElementById('broken-links');
  const totalLinksCount = document.getElementById('total-links-count');
  const brokenLinksCount = document.getElementById('broken-links-count');
  const toggleButton = document.getElementById('toggle-broken-links');
  const brokenLinksContainer = document.getElementById('broken-links-container');
  console.log('Popup loaded');

  // Initialize broken links count
  let brokenLinksTotal = 0;

  // Fetch the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('No active tab found');
      return;
    }

    const tabId = tabs[0].id;
    console.log(`Current tab ID: ${tabId}`);

    // Restore saved state
    chrome.storage.local.get([`${tabId}_brokenLinksTotal`, `${tabId}_dropdownState`, `${tabId}_brokenLinks`], (result) => {
      brokenLinksTotal = result[`${tabId}_brokenLinksTotal`] || 0;
      brokenLinksCount.textContent = `Total links broken: ${brokenLinksTotal}`;
      updateBadge(tabId, brokenLinksTotal);

      const brokenLinks = result[`${tabId}_brokenLinks`] || [];
      brokenLinks.forEach(({ link, status }) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${link}: ${status}`;
        brokenLinksList.appendChild(listItem);
      });

      if (result[`${tabId}_dropdownState`] === 'expanded') {
        brokenLinksContainer.classList.remove('collapsed');
        toggleButton.textContent = 'Hide Broken Links';
      } else {
        brokenLinksContainer.classList.add('collapsed');
        toggleButton.textContent = 'Show Broken Links';
      }
    });

    // Toggle broken links visibility
    toggleButton.addEventListener('click', () => {
      if (brokenLinksContainer.classList.contains('collapsed')) {
        brokenLinksContainer.classList.remove('collapsed');
        toggleButton.textContent = 'Hide Broken Links';
        chrome.storage.local.set({ [`${tabId}_dropdownState`]: 'expanded' });
      } else {
        brokenLinksContainer.classList.add('collapsed');
        toggleButton.textContent = 'Show Broken Links';
        chrome.storage.local.set({ [`${tabId}_dropdownState`]: 'collapsed' });
      }
    });

    // Open a connection to the background script
    const port = chrome.runtime.connect({ name: "popup" });
    port.postMessage({ command: "initiateLinkCheck", tabId });

    // Listen for the total links count
    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "totalLinksCounted" && message.tabId === tabId) {
        console.log(`Total links counted: ${message.totalLinks}`);
        totalLinksCount.textContent = `Total links detected: ${message.totalLinks}`;
      }

      if (message.command === "linkCheckDone" && message.tabId === tabId) {
        console.log('Link check finished');
      }
    });

    // Listen for updates to broken links
    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "updateBrokenLinks" && message.tabId === tabId) {
        console.log('Updating broken links list');
        const { link, status } = message;

        // Check if the link already exists in the list to avoid duplication
        if (![...brokenLinksList.children].some(item => item.textContent.includes(link))) {
          // Increment the broken links counter
          brokenLinksTotal++;
          brokenLinksCount.textContent = `Total links broken: ${brokenLinksTotal}`;
          chrome.storage.local.set({ [`${tabId}_brokenLinksTotal`]: brokenLinksTotal });

          // Update badge
          updateBadge(tabId, brokenLinksTotal);

          // Add the broken link to the list
          const listItem = document.createElement('li');
          listItem.textContent = `${link}: ${status}`;
          brokenLinksList.appendChild(listItem);

          // Save the broken link to storage
          chrome.storage.local.get([`${tabId}_brokenLinks`], (result) => {
            const brokenLinks = result[`${tabId}_brokenLinks`] || [];
            brokenLinks.push({ link, status });
            chrome.storage.local.set({ [`${tabId}_brokenLinks`]: brokenLinks });
          });
        }
      }
    });
  });

  // Function to update the badge
  function updateBadge(tabId, count) {
    chrome.browserAction.setBadgeText({ text: count.toString(), tabId: tabId });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000" });
  }
});
