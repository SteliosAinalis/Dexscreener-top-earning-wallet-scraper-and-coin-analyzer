# 🚀 DexScreener Top Earning Wallet Scraper & Coin Analyzer

![Node.js](https://img.shields.io/badge/Node.js%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-Solscan-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Automation](https://img.shields.io/badge/Automation-Puppeteer-orange?style=for-the-badge&logo=googlechrome&logoColor=white)

> **Track the Smart Money.** A Node.js tool that scrapes top-performing traders from DexScreener and cross-references them with Solscan to extract critical wallet metrics.

---

## 📖 Overview

The **DexScreener Wallet Analyzer** automates the process of finding profitable wallets on the Solana blockchain. Instead of manually checking every trader, this tool does the heavy lifting:

*   🔎 **Scrapes DexScreener**: Extracts the "Top Traders" list from any given token pair.
*   🔬 **Analyzes on Solscan**: Opens a browser to navigate individual wallet pages and extract deep-dive information.
*   📊 **Generates Intelligence**: Returns actionable data such as win rates, and specific coin holdings.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🤖 **Auto-Scraping** | Bypasses Cloudflare protections to grab profitable wallets directly from a pair's page. |
| 🕸️ **Solscan Integration** | Navigates to Solscan for every wallet to verify balances and coins held. |
| 📈 **ROI Filtering** | Filters winners specifically by **percentage profit (%)** rather than just raw profit amount, identifying high-efficiency traders. |
| 💎 **Gem Detection** | Generates a cross-referenced table showing which coins are held by **multiple** "sniper" wallets simultaneously. |

---

## ⚠️ Disclaimer & Status

### 🚧 Work in Progress
> **Note:** This project is currently about a year old. Many aspects of the scraping logic and analysis algorithms need to improved. 

### 🛑 Risk Warning
**Educational and research Purposes Only.**
Cryptocurrency trading involves significant risk. This tool is provided strictly for research and educational purposes.
*   **Do NOT** make trades blindly based on this tool's output.
*   **Always Do Your Own Research (DYOR).**
