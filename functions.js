const { connect } = require("puppeteer-real-browser");
const fs = require('fs');
const path = require('path');


async function clickGotItButton(page) {
    try {
        const gotItButton = await page.evaluateHandle(() => {
            function findButtonInShadowRoots(root = document) {
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
                    acceptNode: (node) => {
                        if (node.tagName === 'BUTTON' && node.textContent.trim() === 'Got it!') {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                });
                let found = walker.nextNode();
                if (found) return found;

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



function gemFinder() {
    const portfolioFolder = path.join(__dirname, 'portfolios');

    if (!fs.existsSync(portfolioFolder)) {
        fs.mkdirSync(portfolioFolder);
    }

    const jsonFiles = fs.readdirSync(portfolioFolder).filter(file => file.endsWith('.json'));

    const addressCount = {};

    for (const file of jsonFiles) {
        const filePath = path.join(portfolioFolder, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);

            for (const entry of data) {
                if (Array.isArray(entry.extractedSpans)) {
                    for (const address of entry.extractedSpans) {
                        addressCount[address] = (addressCount[address] || 0) + 1;
                    }
                }
            }
        } catch (error) {
            console.error(`Error parsing ${file}:`, error.message);
        }
     
    }

    const sortedAddresses = Object.entries(addressCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([address, count]) => ({ address, count }));

    const outputPath = path.join(__dirname, 'top_gems.json');
    fs.writeFileSync(outputPath, JSON.stringify(sortedAddresses, null, 2), 'utf-8');

    console.log(sortedAddresses);

    console.log(`Top 20 addresses saved to ${outputPath}`);
}


async function analyzeTopGems() {
    const filePath = path.join(__dirname, 'top_gems.json');

    if (!fs.existsSync(filePath)) {
        console.error('top_gems.json not found. Run gemFinder() first.');
        return;
    }

    let addresses;
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        addresses = JSON.parse(content);
    } catch (error) {
        console.error('Error reading or parsing top_gems.json:', error.message);
        return;
    }
    const top20Addresses = addresses.slice(0, 20);

    for (const entry of top20Addresses) {
        if (entry.address) {
            try {
                console.log(`Analyzing ${entry.address}...`);
                await start(entry.address); 
            } catch (err) {
                console.error(`Error analyzing ${entry.address}: ${err.message}`);
            }
        }
    }

    console.log('Finished analyzing top 20 addresses.');
}



function extractAllCoinNames() {
    const gemsFolder = path.join(__dirname, 'gems');
    const outputPath = path.join(__dirname, 'coins.json');

    if (!fs.existsSync(gemsFolder)) {
        console.error('Gems folder does not exist. Run analyzeTopGems() first.');
        return;
    }

    const files = fs.readdirSync(gemsFolder).filter(file => file.endsWith('.json'));

    const coinNames = new Set();

    for (const file of files) {
        const filePath = path.join(gemsFolder, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const coins = JSON.parse(content);

            for (const coin of coins) {
                if (coin.name) {
                    coinNames.add(coin.name);
                }
            }
        } catch (err) {
            console.error(`Error reading ${file}:`, err.message);
        }
    }

    const coinList = Array.from(coinNames).sort();

    fs.writeFileSync(outputPath, JSON.stringify(coinList, null, 2));
    console.log(`Saved ${coinList.length} unique coin names to ${outputPath}`);
}







function countCoinFrequencies() {
    const filePath = path.join(__dirname, 'coins.json');

    if (!fs.existsSync(filePath)) {
        console.error('coins.json not found.');
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const coinNames = JSON.parse(content); 

        const frequencyMap = {};

        for (const name of coinNames) {
            frequencyMap[name] = (frequencyMap[name] || 0) + 1;
        }

        const sorted = Object.entries(frequencyMap)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        console.log("Coin Frequencies:");
        console.table(sorted);
    } catch (error) {
        console.error('Error reading or parsing coins.json:', error.message);
    }
}











//analyzer script


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function changePageSizeTo40(page) {
    try {
        const comboBoxButton = await page.waitForSelector('button[role="combobox"]');
        await comboBoxButton.click();

        const options = await page.$$('div[role="option"]');
        for (const option of options) {
            const text = await option.evaluate(el => el.innerText.trim());
            if (text === '40') {
                await option.click();
                return;
            }
        }
    } catch (error) {
        console.error("Failed to change page size:", error);
    }
}

async function getColumnIndex(page, columnName) {
    const headerRow = await page.$('thead tr');
    const headers = await headerRow.$$eval('th', ths => ths.map(th => th.innerText.trim()));
    const columnIndex = headers.findIndex(header => header.toLowerCase() === columnName.toLowerCase());
    return columnIndex;
}

async function getCoinsOnPage(page, tokenNameColumnIndex, valueColumnIndex) {
    const coins = await page.$$eval('table tbody tr', (rows, tokenNameColumnIndex, valueColumnIndex) => {
        return rows.map(row => {
            const columns = row.querySelectorAll('td');
            const tokenName = columns[tokenNameColumnIndex]?.innerText.trim();
            const valueText = columns[valueColumnIndex]?.innerText.trim().replace(/[^\d.]/g, '');
            const value = parseFloat(valueText);
            if (isNaN(value) || value <= 1) return null;
            return { name: tokenName, value };
        }).filter(Boolean);
    }, tokenNameColumnIndex, valueColumnIndex);
    return coins;
}

async function goToNextPage(page) {
    try {
        const nextButton = await page.$('button svg path[d="m9 18 6-6-6-6"]');
        if (!nextButton) {
            return false;
        }

        const nextPageButton = await nextButton.evaluateHandle(svg => svg.closest('button'));
        const isDisabled = await nextPageButton.evaluate(btn => btn.disabled || btn.getAttribute('disabled') !== null);
        if (isDisabled) {
            return false;
        }

        await nextPageButton.click();
        return true;
    } catch (error) {
        console.error("Error going to the next page:", error);
        return false;
    }
}

async function getAllCoinsFromAllPages(page) {
    let allCoins = [];
    let pageIndex = 1;

    const tokenNameColumnIndex = await getColumnIndex(page, 'Token Name');
    const valueColumnIndex = await getColumnIndex(page, 'Value');

    while (true) {
        await page.waitForSelector('table tbody tr');
        const coins = await getCoinsOnPage(page, tokenNameColumnIndex, valueColumnIndex);

        if (coins.length === 0) {
            break;
        }

        allCoins.push(...coins);

        const invalidCoinFound = coins.some(coin => coin.value <= 1);
        if (invalidCoinFound) {
            break;
        }

        const hasNextPage = await goToNextPage(page);
        if (!hasNextPage) {
            break;
        }

        pageIndex++;
    }

    return allCoins;
}

async function start(walletAddress) {
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });

        await page.goto("https://solscan.io", { waitUntil: "networkidle2" });
        await clickGotItButton(page);

        const portfolioURL = `https://solscan.io/account/${walletAddress}#portfolio`;
        await page.goto(portfolioURL, { waitUntil: "networkidle2" });

        await page.waitForSelector('table tbody tr');
        await changePageSizeTo40(page);

        const coinsOver1Dollar = await getAllCoinsFromAllPages(page);


        
        

        const folderPath = path.join(__dirname, 'gems');
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        const filePath = path.join(folderPath, `${walletAddress}.json`);
        fs.writeFileSync(filePath, JSON.stringify(coinsOver1Dollar, null, 2));

        console.log(`Results saved to ${filePath}`);

        console.log("Coins over $1:");
        console.table(coinsOver1Dollar);  

        await browser.close();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}





module.exports = { clickGotItButton, gemFinder, analyzeTopGems, extractAllCoinNames, countCoinFrequencies};