const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const config = require(path.join(process.cwd(), "./config.js"))
const API_URL = `https://eth-mainnet.alchemyapi.io/v2/${config.alchemyKey}`
const {createAlchemyWeb3} = require("@alch/alchemy-web3")
const web3 = createAlchemyWeb3(API_URL)

const ADDRESS_LIST = config.ADDRESS_LIST

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

async function getTokenId(contract, address) {
    contract = [contract]
    const nfts = await web3.alchemy.getNfts({owner: address, contractAddresses: contract})
    if (nfts.totalCount == 0) {
      return nfts.totalCount
    }
    console.log("\nnumber of NFTs found:", nfts.totalCount);
    let tokenId_list = []
    for (const nft of nfts.ownedNfts) {
      // 16进制转10进制
      let tokenIdDec = parseInt(nft.id.tokenId, 16)  
      console.log("token ID:", tokenIdDec);
      tokenId_list.push(tokenIdDec)
      fs.appendFileSync(`./collection/${contract}.txt`, tokenIdDec + '\n')
    }
    return tokenId_list
}

const checkNFT = async (contractAddress) => {
    
    fs.writeFileSync(path.join(process.cwd(), `./collection/${contractAddress}.txt`), '')
    let tokenIdMap = new Map();
    let allNftBalance = 0;
    for (let i = 0; i < ADDRESS_LIST.length; i++) {
        let address = ADDRESS_LIST[i];
        let tokenId_list = await getTokenId(contractAddress, address);
        let nftBalance = tokenId_list.length;
        if (tokenId_list !== 0) {
            console.log(`${address} NFT balance: ${nftBalance}`);
            allNftBalance += nftBalance;
            tokenIdMap.set(address, tokenId_list); 
        }
    }
    console.log(`NFT ${contractAddress} \nALL Address balance: ${allNftBalance}`);
    if (allNftBalance == 0) {
        process.exit(0)
    }
    return tokenIdMap;
}

const getRankMap = async (contract, tokenIdList) => {
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
        console.log(`\ncontract: ${contract}`);
        let fileName = path.join(process.cwd(), `./rank/${contract}.txt`);
        fs.writeFileSync(fileName, "");        
        for (let [key, value] of sorted_map) {
            console.log(`tokenId: ${key} rank: ${value}`);
            fs.appendFileSync(`./rank/${contract}.txt`, `tokenId: ${key} rank: ${value}` + '\n')
        }
        
        

    } finally {
        await driver.quit(); // 退出浏览器
        process.exit(0)
    }
}

const startApp = async () => {
    if (process.argv.length < 3) {
        console.log(`\n请输入合约地址\n`)
        let contractAddress = await new Promise(resolve => {
          readline.question("合约地址? ", resolve)
        })
        contractAddress = contractAddress.toLowerCase();
        let tokenIdMap = await checkNFT(contractAddress);
        let tokenIdList = Array.from(tokenIdMap.values());
        tokenIdList = tokenIdList.flat();
        await getRankMap(contractAddress, tokenIdList);
        
    } 

    else if (process.argv.length == 3) {
        args = process.argv.slice(2);
        let contractAddress = args[0];
        contractAddress = contractAddress.toLowerCase();
        let tokenIdMap = await checkNFT(contractAddress);
        let tokenIdList = Array.from(tokenIdMap.values());
        tokenIdList = tokenIdList.flat();
        await getRankMap(contractAddress, tokenIdList);

    }
    else {
        console.log(`\n参数错误\n`)
    }
}

startApp()
