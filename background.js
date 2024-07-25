console.log('Background script loaded');

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    port.onMessage.addListener((msg) => {
      if (msg.command === "initiateLinkCheck") {
        console.log('Popup opened, checking if link check is needed');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id;
          chrome.storage.local.get([`${tabId}_completed`], (result) => {
            if (!result[`${tabId}_completed`]) {
              console.log(`Sending message to tab ${tabId} to start link check`);
              chrome.tabs.sendMessage(tabId, { command: "checkLinks", tabId: tabId }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error sending message to content script:', chrome.runtime.lastError.message);
                } else {
                  console.log('Message sent to content script:', response);
                }
              });
            } else {
              console.log(`Link check already completed for tab ${tabId}`);
              // Notify the popup to load existing data
              chrome.runtime.sendMessage({ command: "linkCheckDone", tabId: tabId });
            }
          });
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "updateBadge") {
    console.log(`Updating badge for tab ${message.tabId}: ${message.text}`);
    chrome.browserAction.setBadgeText({ text: message.text, tabId: message.tabId });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000", tabId: message.tabId });
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
