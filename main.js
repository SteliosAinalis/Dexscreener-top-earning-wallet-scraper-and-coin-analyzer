const { gemFinder } = require('./functions');
const { analyzeTopGems } = require('./functions');
const { extractAllCoinNames } = require('./functions');
const { countCoinFrequencies } = require('./functions');
const { run } = require('./index');  
const { findFrequentWallets } = require('./findFrequentWallets'); 

async function main() {
    try {
        await run();  
        console.log("index.js Script completed.");
        } catch (err) {
        console.error(" Error running index.js:", err);
        }  
    try {
        const runPortfolio = require('./portfolio');
        await runPortfolio();
        console.log("portfolio.js script completed.");
    } catch (err) {
        console.error(" Error in portfolio.js:", err);
    }
    try {
        await gemFinder();
        console.log("gemFinder script completed.");
    } catch (err) {
        console.error(" Error in gemFinder.js:", err);
    }
    

    
    analyzeTopGems();
    extractAllCoinNames();
    countCoinFrequencies();
    
    findFrequentWallets(); 
}



main();