# compost
 a firefox extension for checking link rot

![compost](https://github.com/user-attachments/assets/e332c11c-af37-4e94-abaa-d812b0a26d5c)


 # What does it do?
I'm sick of clicking links and hitting 404 pages, home page redirects or sites that just don't exist anymore. Link rot sucks, and i want a way to know if a link is broken before I click it. This extension counts the number of links present on a webpage and checks each link to see if it returns an HTML status code error. If it does, it counts it as a broken link and displays it as broken.

Link rot will become more and more pervasive as time goes on. [Pew Research](https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/) says that 38% of webpages available in 2013 are no longer accesible in 2024. That sucks!

# Steps to load the extension:
1. Download folder
2. Load the Extension: Go to about:debugging in Firefox, click "This Firefox" or "This Nightly", then "Load Temporary Add-on", and select the manifest.json file from the extensions directory.
3. To detect broken links, click the extension on the toolbar. 

# Issues
This has some rough edges and a couple issues I'm working on:
- Extremely slow on sites with more than a few hundred links
- Doesn't persist list of broken links when popup is closed and reopened
- Ugly UI is ugly

Microsoft redirects all their links... go figure. Will have to figure out how to detect that while still detecting homepage redirects for missing pages. 
- ![image](https://github.com/user-attachments/assets/1676ed04-319f-48bc-bfaf-b467526f46e2)

All these links are actually broken...home page redirect or 404 page. Working as expected.
- <img width="1465" alt="image" src="https://github.com/user-attachments/assets/8ac6a83c-0555-4256-a7a9-e8bd307a0a63">

# Wishlist Features
- Highlighting broken links on the webpage
- Some kind of link rot reporting mechanism/database

