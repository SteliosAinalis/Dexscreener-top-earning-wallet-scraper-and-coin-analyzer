const { connect } = require("puppeteer-real-browser");
const fs = require('fs');
const path = require('path');
const { clickGotItButton } = require('./functions');


const currentDate = new Date();
const dateString = currentDate.toDateString();

const filePath = path.join(__dirname, 'data', `${currentDate.toDateString()}.json`);
const fileContent = fs.readFileSync(filePath, 'utf-8');
const coinsData = JSON.parse(fileContent);

const portfolioFolder = path.join(__dirname, 'portfolios');
if (!fs.existsSync(portfolioFolder)) {
    fs.mkdirSync(portfolioFolder);
}


async function Open() {
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });

        await page.goto("https://solscan.io", { waitUntil: "networkidle2" });
        await clickGotItButton(page);

        console.log("Page loaded and 'Got it' clicked.");

        browser.on('targetcreated', async (target) => {
            const newPage = await target.page();
            if (!newPage) return;
          
            const url = newPage.url();
            if (url === "https://solscan.io/privacy-policy"){
              await newPage.close();
              console.log("Closed privacy policy tab:", url);
            }
          });
          

        return { browser, page };
    } catch (error) {
        console.error("Error opening Puppeteer:", error);
        return null;
    }
}
  
  
  

  

async function main() {
    const { browser, page } = await Open();
    if (!browser || !page) return;

    await clickGotItButton(page);

    const extractedData = [];

    for (const coinData of coinsData) {
        const coinInfo = {
            coin: coinData.coin,
            extractedSpans: []
        };

        for (const key of Object.keys(coinData)) {
            if (key.startsWith('link') && coinData[key]) {            
                const newPage = await browser.newPage();
                await newPage.goto(coinData[key], { waitUntil: 'networkidle2' });

                

                const additionalSpanText = await newPage.evaluate(() => {
                    const spanElement = document.querySelector('span[class*="break-words"][class*="mr-3"][class*="align-middle"][class*="font-normal"][class*="text-neutral7"][class*="text-[14px]"][class*="sm:text-[16px]"][class*="leading-[24px]"]');
                    return spanElement ? spanElement.textContent.trim() : null;
                });

                if (additionalSpanText) {
                    coinInfo.extractedSpans.push(additionalSpanText); 
                }

                await newPage.close(); 
            }
        }

        extractedData.push(coinInfo);
    }

    
    // const currentDate = new Date().toDateString();
    const portfolioFilePath = path.join(portfolioFolder, `${currentDate.toDateString()}.json`);
    
    fs.writeFileSync(portfolioFilePath, JSON.stringify(extractedData, null, 2));
    console.log(`Data saved to ${portfolioFilePath}`);

    await browser.close(); 
}

module.exports = async function runPortfolio() {
    await main();
  };
  
  