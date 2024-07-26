chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    port.onMessage.addListener((msg) => {
      if (msg.command === "initiateLinkCheck") {
        const tabId = msg.tabId;
        console.log(`Popup opened, initiating link check for tab ${tabId}`);
        chrome.storage.local.get([`${tabId}_completed`], (result) => {
          if (!result[`${tabId}_completed`]) {
            console.log(`Sending message to tab ${tabId} to start link check`);
            chrome.tabs.sendMessage(tabId, { command: "checkLinks", tabId }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error sending message to content script:', chrome.runtime.lastError.message);
              } else {
                console.log('Message sent to content script:', response);
              }
            });
          } else {
            console.log(`Link check already completed for tab ${tabId}`);
            port.postMessage({ command: "linkCheckDone", tabId });
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "updateBadge") {
    console.log(`Updating badge for tab ${message.tabId}: ${message.text}`);
    chrome.browserAction.setBadgeText({ text: message.text.toString(), tabId: message.tabId });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000" });
  } else if (message.command === "linkCheckDone") {
    console.log(`Link check done for tab ${message.tabId}, notifying popup`);
    chrome.storage.local.set({ [`${message.tabId}_completed`]: true }, () => {
      chrome.runtime.sendMessage({ command: "linkCheckDone", tabId: message.tabId });
    });
  } else if (message.command === "totalLinksCounted") {
    console.log(`Total links counted for tab ${message.tabId}: ${message.totalLinks}`);
    chrome.runtime.sendMessage({ command: "totalLinksCounted", tabId: message.tabId, totalLinks: message.totalLinks });
  }
});

// Clear stored data for a tab on refresh
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    console.log(`Tab ${tabId} is reloading, clearing stored data.`);
    chrome.storage.local.remove([`${tabId}_brokenLinksTotal`, `${tabId}_dropdownState`, `${tabId}_brokenLinks`, `${tabId}_completed`], () => {
      console.log(`Cleared stored data for tab ${tabId}`);
      chrome.browserAction.setBadgeText({ text: '', tabId: tabId }); // Clear the badge text as well
    });
  }
});
