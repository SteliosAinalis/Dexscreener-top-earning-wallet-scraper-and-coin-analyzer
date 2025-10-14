const { connect } = require("puppeteer-real-browser");
const { clickGotItButton } = require('./functions');
const fs = require('fs');
const path = require('path');

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

async function main(walletAddress) {
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
        console.table(coinsOver1Dollar);  // Neatly formatted table in the console

        await browser.close();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main("j1oeQoPeuEDmjvyMwBmCWexzCQup77kbKKxV59CnYbd");
