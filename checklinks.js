async function checkLinksExcludingHeaderFooter() {
    console.log('Checking links...');
    const links = document.querySelectorAll('body a:not(header a):not(footer a)');
    const linkStatuses = [];
  
    for (const link of links) {
      const href = link.href;
      if (!href) continue;
  
      try {
        const response = await fetch(href, { method: 'HEAD' });
        if (!response.ok) {
          linkStatuses.push({ link: href, status: response.status });
        }
      } catch (error) {
        linkStatuses.push({ link: href, status: 'Fetch error or CORS issue' });
      }
    }
  
    const brokenLinkCount = linkStatuses.length;
    console.log('Broken link count:', brokenLinkCount);
    browser.runtime.sendMessage({
      command: "updateBadge",
      text: brokenLinkCount.toString()
    });
  
    await browser.storage.local.set({ brokenLinks: linkStatuses });
    console.log('Broken links stored:', linkStatuses);
  
    if (brokenLinkCount === 0) {
      console.log('All links (excluding header and footer) are working fine.');
    } else {
      console.warn('Broken links (excluding header and footer) found:');
      linkStatuses.forEach(({ link, status }) => {
        console.warn(`Link: ${link}, Status: ${status}`);
      });
    }
  }
  