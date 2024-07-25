document.addEventListener('DOMContentLoaded', async () => {
    const brokenLinksList = document.getElementById('broken-links');
    const totalLinksCount = document.getElementById('total-links-count');
    const brokenLinksCount = document.getElementById('broken-links-count');
    console.log('Popup loaded');
  
    // Initialize broken links count
    let brokenLinksTotal = 0;
  
    // Open a connection to the background script
    const port = chrome.runtime.connect({ name: "popup" });
    port.postMessage({ command: "initiateLinkCheck" });
  
    // Listen for the total links count
    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "totalLinksCounted") {
        console.log(`Total links counted: ${message.totalLinks}`);
        totalLinksCount.textContent = `Total links detected: ${message.totalLinks}`;
      }
    });
  
    // Listen for updates to broken links
    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "updateBrokenLinks") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id;
          if (message.tabId === tabId) {
            console.log('Updating broken links list');
            const { link, status } = message;
  
            // Increment the broken links counter
            brokenLinksTotal++;
            brokenLinksCount.textContent = `Total links broken: ${brokenLinksTotal}`;
  
            // Add the broken link to the list
            const listItem = document.createElement('li');
            listItem.textContent = `${link}: ${status}`;
            brokenLinksList.appendChild(listItem);
          }
        });
      }
  
      // Listen for link check completion and load existing data if needed
      if (message.command === "linkCheckDone") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id;
          if (message.tabId === tabId) {
            console.log('Link check done, loading existing data');
            chrome.storage.local.get(tabId, (result) => {
              const tabData = result[tabId] || {};
              const brokenLinks = tabData.brokenLinks || [];
              const totalLinks = tabData.totalLinks || 0;
  
              // Update total links count
              totalLinksCount.textContent = `Total links detected: ${totalLinks}`;
  
              // Update broken links count and list
              brokenLinksTotal = brokenLinks.length;
              brokenLinksCount.textContent = `Total links broken: ${brokenLinksTotal}`;
  
              // Clear existing list
              brokenLinksList.innerHTML = '';
              brokenLinks.forEach(({ link, status }) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${link}: ${status}`;
                brokenLinksList.appendChild(listItem);
              });
            });
          }
        });
      }
    });
  });
  