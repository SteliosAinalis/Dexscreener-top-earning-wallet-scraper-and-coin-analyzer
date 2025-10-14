const { connect } = require("puppeteer-real-browser");
const fs = require('fs');
const path = require('path');
const { clickGotItButton } = require('./functions');


const currentDate = new Date();
const dateString = currentDate.toDateString();





async function Open() {
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });

        await page.goto("https://dexscreener.com/?rankBy=trendingScoreH24&order=desc", { waitUntil: "networkidle2" });
        await new Promise(resolve => setTimeout(resolve, 2000));  

        console.log("Dexscreener page loaded.");
        return { browser, page };
    } catch (error) {
        console.error("Error opening Puppeteer:", error);
        return null;
    }
}



async function getTop3Links(page) {
    try {
        console.log("Waiting for table rows...");
        await page.waitForSelector("a.ds-dex-table-row");

        const top3Links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("a.ds-dex-table-row"))
                .slice(0, 20)
                .map(a => a.href);
        });
        
        return top3Links;
    } catch (error) {
        console.error("Error getting top 3 links:", error);
        return [];
    }
}

async function getTop5ExplorerLinks(page) {
    try {
        await page.waitForSelector("div.custom-1dwgrrr a.chakra-link", { timeout: 30000 });

        const top5Links = await page.evaluate(() => {
            console.log("Opening link...");
            
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

    // Wait for and click the chart button
    await page.waitForSelector('button.chakra-button.custom-75ioyn', { timeout: 5000 });
    await page.click('button.chakra-button.custom-75ioyn');
    
    // Wait for and click the top traders button
    await page.waitForSelector('button.chakra-button.custom-tv0t33', { timeout: 5000 });
    await page.click('button.chakra-button.custom-tv0t33');

    const explorerLinks = await getTop5ExplorerLinks(page);


    await page.close();
    return explorerLinks;
}

async function Save(top3Links, top5LinksPerCoin) {
    const structuredData = [];

    for (let i = 0; i < top3Links.length; i++) {
        const coin = top3Links[i];
        const links = top5LinksPerCoin[i];

        structuredData.push({
            coin: coin,
            link1: links[0] || null,
            link2: links[1] || null,
            link3: links[2] || null,
            link4: links[3] || null,
            link5: links[4] || null,
        });
    }

    const jsonData = JSON.stringify(structuredData, null, 2);

    const folderPath = path.join(__dirname, 'data');

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    const filePath = path.join(folderPath, `${dateString}.json`);

    fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log(`Data saved to ${filePath}`);
        }
    });
}



async function run() {
    const { browser, page } = await Open();
    if (!browser || !page) return;

    await clickGotItButton(page);
    await page.setViewport({ width: 1280, height: 800 });


    const top3Links = await getTop3Links(page);
    
    const top5LinksArray = [];
    
    for (let i = 0; i < top3Links.length; i++) {
        const explorerLinks = await openLink(top3Links[i], browser);
        top5LinksArray.push(explorerLinks); 
    }

    await Save(top3Links, top5LinksArray);

    await browser.close();
}

module.exports = { run };

