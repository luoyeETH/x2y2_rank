from selenium import webdriver
import time
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException


def launchSeleniumWebdriver():
    global driver
    option = webdriver.ChromeOptions()
    s = Service("chromedriver.exe")
    option.add_argument("--user-data-dir=" + r'D:\ChromeSelenium_1')
    driver = webdriver.Chrome(options=option, service=s)

    return driver


if __name__ == '__main__':

    driver = launchSeleniumWebdriver()
    driver.implicitly_wait(5)
    tokenId_List = []
    contract = input("请输入合约地址：")
    fp = open(f'{contract}.txt', 'r', encoding='utf-8')
    tokenId_List = fp.read().splitlines()
    fp.close()
    rank_map = {}
    
    for i in tokenId_List:
        driver.get(f'https://x2y2.io/eth/{contract}/{i}')
        # time.sleep(1)
        element_lists = driver.find_elements(By.XPATH, "//p[@class='ts-caption-2 font-bold']")
        if element_lists[0].text == 'N/A':
            print("未显示RANK")
            break
        if len(element_lists) == 2:
            if element_lists[1].text == 'N/A':
                print("未显示RANK")
                break
            rank = element_lists[1].text[1:]
            rank = int(rank)
            print(f'tokenId: {i}, rank: {rank}')
            rank_map[i] = rank
    rank_map = sorted(rank_map.items(), key=lambda x: x[1])
    print(f"\ncontract:{contract}\n")
    for k, v in rank_map:
        print('tokenId: {}, rank: {}'.format(k, v))
    fp = open(f'rank_{contract}.txt', 'w', encoding='utf-8')
    for k, v in rank_map:
        fp.write(f'tokenId: {k}, rank: {v}\n')
    fp.close()

    print("done")
    time.sleep(60)
    driver.quit()
