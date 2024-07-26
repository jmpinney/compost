console.log("Content script loaded and listening for messages.");

chrome.runtime.onMessage.addListener((message) => {
  if (message.command === "checkLinks") {
    console.log('Received checkLinks command');
    const tabId = message.tabId;
    countAndFilterLinks(tabId);
  }
});

function countAndFilterLinks(tabId) {
  console.log('Counting and filtering links...');
  const links = Array.from(document.querySelectorAll('body a:not(header a):not(footer a)'));
  const filteredLinks = links.filter(link => 
    !link.href.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i) && 
    !link.href.startsWith('mailto:') && 
    !link.href.startsWith('javascript:')
  );
  const totalLinks = filteredLinks.length;
  const linkArray = filteredLinks.map(link => link.href);

  // Store the total number of links and the link array for the tab, then notify popup
  const tabData = {
    totalLinks: totalLinks,
    linkArray: linkArray
  };

  chrome.storage.local.set({ [tabId]: tabData }, () => {
    console.log(`Filtered links counted: ${totalLinks}`);
    console.log('Stored tab data:', tabData);
    chrome.runtime.sendMessage({ command: "totalLinksCounted", tabId: tabId, totalLinks: totalLinks });
  });

  // Start checking links
  checkLinksExcludingHeaderFooter(tabId, linkArray);
}

async function checkLink(url, retry = 3) {
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    console.log(`Checked URL: ${url} - Status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`Error checking URL: ${url} - ${error.message}`);
    if (retry > 0) {
      console.log(`Retrying ${url}, attempts left: ${retry}`);
      return await checkLink(url, retry - 1);
    }
    return false;
  }
}

async function checkLinksExcludingHeaderFooter(tabId, linkArray) {
  console.log('Checking links...');
  const linkStatuses = [];

  for (const href of linkArray) {
    if (!href) continue;

    const isLinkOk = await checkLink(href);
    if (!isLinkOk) {
      linkStatuses.push({ link: href, status: 'Broken or CORS issue' });
      chrome.runtime.sendMessage({
        command: "updateBrokenLinks",
        link: href,
        status: 'Broken or CORS issue',
        tabId: tabId
      });
      updateBadge(tabId, linkStatuses.length);
    }
  }

  const brokenLinkCount = linkStatuses.length;
  console.log('Broken link count:', brokenLinkCount);
  updateBadge(tabId, brokenLinkCount);

  chrome.storage.local.get(tabId, (result) => {
    const tabData = result[tabId];
    tabData.brokenLinks = linkStatuses;

    chrome.storage.local.set({ [tabId]: tabData }, () => {
      console.log('Broken links stored:', linkStatuses);
      chrome.runtime.sendMessage({ command: "linkCheckDone", tabId: tabId }); // Notify that link check is done
    });
  });

  if (brokenLinkCount === 0) {
    console.log('All links (excluding header and footer) are working fine.');
  } else {
    console.warn('Broken links (excluding header and footer) found:');
    linkStatuses.forEach(({ link, status }) => {
      console.warn(`Link: ${link}, Status: ${status}`);
    });
  }
}

// Function to update the badge
function updateBadge(tabId, count) {
  chrome.browserAction.setBadgeText({ text: count.toString(), tabId: tabId });
  chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000" });
}
