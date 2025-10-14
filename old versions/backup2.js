const { connect } = require("puppeteer-real-browser");

async function Open() {
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });

        // Open Solscan and accept cookies
        await page.goto("https://solscan.io", { waitUntil: "networkidle2" });

        // Attempt to click "Got it!" button
        await clickGotItButton(page);

        console.log("Page loaded and 'Got it' clicked.");

        // Now, navigate to Dexscreener as before
        await page.goto("https://dexscreener.com/?rankBy=trendingScoreH24&order=desc", { waitUntil: "networkidle2" });

        // Wait for a bit to ensure page has fully loaded
        await new Promise(resolve => setTimeout(resolve, 2000));  // Custom timeout for 2 seconds

        console.log("Dexscreener page loaded.");
        return { browser, page };  
    } catch (error) {
        console.error("Error opening Puppeteer:", error);
        return null; 
    }
}

async function clickGotItButton(page) {
    try {
        // Search inside Shadow DOM
        const gotItButton = await page.evaluateHandle(() => {
            function findButtonInShadowRoots(root = document) {
                const walker = document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: (node) => {
                            if (node.tagName === 'BUTTON' && node.textContent.trim() === 'Got it!') {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            return NodeFilter.FILTER_SKIP;
                        }
                    }
                );
                let found = walker.nextNode();
                if (found) return found;

                // Check shadow roots
                const elements = root.querySelectorAll('*');
                for (const el of elements) {
                    if (el.shadowRoot) {
                        const result = findButtonInShadowRoots(el.shadowRoot);
                        if (result) return result;
                    }
                }
                return null;
            }

            return findButtonInShadowRoots();
        });

        if (gotItButton) {
            console.log("Found 'Got it' button inside Shadow DOM. Clicking...");
            await gotItButton.click();
        } else {
            console.log("Could not find 'Got it' button inside Shadow DOM.");
        }
    } catch (error) {
        console.error("Error clicking 'Got it' button:", error);
    }
}

async function getTop3Links(page) {
    try {
        console.log("Waiting for table rows...");
        await page.waitForSelector("a.ds-dex-table-row");

        const top3Links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("a.ds-dex-table-row"))
                .slice(0, 3)
                .map(a => a.href);
        });

        console.log("Top 3 Links:", top3Links);
        return top3Links;
    } catch (error) {
        console.error("Error getting top 3 links:", error);
        return [];
    }
}

async function getTop5ExplorerLinks(page) {
    try {
        
        console.log("finding id...")
        await page.waitForSelector("div.custom-1dwgrrr a.chakra-link", { timeout: 30000 });
        
        const top5Links = await page.evaluate(() => {
            console.log("opening link..")
            return Array.from(document.querySelectorAll("div.custom-1dwgrrr a.chakra-link"))
                .slice(0, 5)
                .map(a => a.href);
        });

        console.log("Top 5 Explorer Links:", top5Links);
        return top5Links;
    } catch (error) {
        console.error("Error getting top 5 explorer links:", error);
        return [];
    }
}


async function openLink(link, browser) {
    const page = await browser.newPage();
    console.log(`Navigating to: ${link}`);
    
    await page.goto(link, { waitUntil: "networkidle2" });
    
    // Chart button
    await page.waitForSelector('button.chakra-button.custom-75ioyn', { timeout: 5000 });
    await page.click('button.chakra-button.custom-75ioyn');
    
    // Top traders button
    await page.waitForSelector('button.chakra-button.custom-tv0t33', { timeout: 5000 });
    await page.click('button.chakra-button.custom-tv0t33');

    const explorerLinks = await getTop5ExplorerLinks(page);
    for (const explorerLink of explorerLinks) {
        const explorerPage = await browser.newPage();
        console.log(`Opening explorer link: ${explorerLink}`);
        await explorerPage.goto(explorerLink, { waitUntil: "networkidle2" });
        await explorerPage.close();
    }

    await page.close();
}

async function main() {
    const { browser, page } = await Open();
    if (!browser || !page) return;

    const top3Links = await getTop3Links(page);
    
    for (let i = 0; i < top3Links.length; i++) {
        await openLink(top3Links[i], browser);
    }

    await browser.close();
}

main();
