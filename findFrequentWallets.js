const fs = require('fs');
const path = require('path');

function findFrequentWallets() {
    const portfolioFolder = path.join(__dirname, 'portfolios');
    const gemsFolder = path.join(__dirname, 'gems');

    if (!fs.existsSync(portfolioFolder)) {
        console.error('Portfolios folder does not exist. Please run the portfolio script first.');
        return;
    }
    
    if (!fs.existsSync(gemsFolder)) {
        fs.mkdirSync(gemsFolder);
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

    const frequentAddresses = Object.entries(addressCount)
        .filter(([address, count]) => count > 3)
        .sort((a, b) => b[1] - a[1]) 
        .map(([address, count]) => ({ address, count }));

    if (frequentAddresses.length === 0) {
        console.log("No wallets found that appeared more than 3 times.");
        return;
    }
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-'); 
    const outputFilename = `frequent_wallets_${timestamp}.json`;
    const outputPath = path.join(gemsFolder, outputFilename);

    fs.writeFileSync(outputPath, JSON.stringify(frequentAddresses, null, 2), 'utf-8');

    console.log(`Found ${frequentAddresses.length} frequent wallets.`);
    console.log(frequentAddresses);
    console.log(`Top wallets (appearing more than 3 times) saved to ${outputPath}`);
}

module.exports = { findFrequentWallets };