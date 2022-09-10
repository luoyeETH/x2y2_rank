const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');


(async function getRankMap(contract, tokenIdList) {
    const width = 1920
    const height = 1080
    let driver = await new Builder().forBrowser("chrome").setChromeOptions(new chrome.Options().addArguments("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36", "--log-level=1", "blink-settings=imagesEnabled=false").headless().windowSize({ width, height })).build(); 
    try {
        let rank_map = new Map()
        for (let i = 0; i < tokenIdList.length; i++) {
        let tokenId = tokenIdList[i]
        let url = `https://x2y2.io/eth/${contract}/${tokenId}`
        await driver.get(url)
        let element_lists = await driver.findElements(By.xpath("//p[@class='ts-caption-2 font-bold']"))
        if (element_lists.length == 1) {
            console.log("未显示RANK");
            break
        }
        if (element_lists.length == 2) {
            let ts_rank = await element_lists[1].getText()
            if (ts_rank == "N/A") {
                console.log("未显示RANK");
                break
            }

            let rank = ts_rank.slice(1)
            rank = parseInt(rank)
            console.log(`tokenId :${tokenId} rank: ${rank}`);
            rank_map.set(tokenId, rank)
        }
        
        }
        if (rank_map.size == 0) {
        return null
        }

        let sorted_map = new Map([...rank_map.entries()].sort((a, b) => a[1] - b[1]))
        console.log(`contract: ${contract}`);

        for (let [key, value] of sorted_map) {
            console.log(`tokenId: ${key} rank: ${value}`);
            }
        return sorted_map

    } finally {
        await driver.quit(); // 退出浏览器
    }
})();
