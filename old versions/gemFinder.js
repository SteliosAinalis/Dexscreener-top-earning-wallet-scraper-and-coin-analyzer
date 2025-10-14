const fs = require('fs');
const path = require('path');

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
    .map(([address, count]) => ({ address, count }));

console.log(sortedAddresses);
