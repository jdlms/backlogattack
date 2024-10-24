import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { BatchWriteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import Chromium from "@sparticuz/chromium";

//LOCAL
// npx @puppeteer/browsers install chromium@latest --path /tmp/localChromium
// then update the version # in the path below
const YOUR_LOCAL_CHROMIUM_PATH =
    "/tmp/localChromium/chromium/mac_arm-1373231/chrome-mac/Chromium.app/Contents/MacOS/Chromium";


const tableName = Resource.Titles.name
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface Title {
    itemKey: string,
    title: string,
    imgUrl: string,
    base: number,
    currentS: number,
    currentWGS: number,
    currentGB: number,
    currentGMG: number,
    currentF: number,
    currentHB: number,
    currentBest: number,
    lastUpdated: number
}

export async function handler() {
    const url = "https://store.steampowered.com/search/?filter=topsellers";

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: process.env.SST_DEV
            ? YOUR_LOCAL_CHROMIUM_PATH
            : await chromium.executablePath(),
        headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(url!);

    const titles = await page.$$eval('.search_result_row', rows =>
        rows.slice(0, 20).map(row => {

            const basePrice = row.querySelector('.discount_orginal_price') ? row.querySelector('.discount_final_price')?.textContent?.trim() : row.querySelector('.discount_orginal_price')?.textContent?.trim()
            const currentPrice = row.querySelector('.discount_final_price') ? row.querySelector('.discount_final_price')?.textContent?.trim() : row.querySelector('.discount_orginal_price')?.textContent?.trim()

            return {
                itemKey: row.getAttribute('data-ds-itemkey') || '',
                title: row.querySelector('.title')?.textContent?.trim() || '',
                imgUrl: row.querySelector('.search_capsule img')?.getAttribute('src') || '',
                base: basePrice,
                currentS: currentPrice
            }
        }))

    // create full title object
    writeGamesToDynamo(titles);

    return {
        statusCode: 200,
        body: titles,
        isBase64Encoded: true,
        headers: {
            "Content-Type": "json",
            "Content-Disposition": "inline",
        },
    };
}

const writeGamesToDynamo = async (titles: any) => {
    // Batch write accepts up to 25 items at a time
    const titleChunks = chunkArray(titles, 25);

    for (const titleBatch of titleChunks) {
        const filteredTitles = titleBatch.filter((title: any) => title.base !== "free")
        console.log(filteredTitles);
        const params = {
            RequestItems: {
                [tableName]: filteredTitles.map((title: any) => ({
                    PutRequest: {
                        Item: {
                            itemKey: { S: title.itemKey },
                            title: { S: title.title },
                            imgUrl: { S: title.imgUrl },
                            base: { N: Number(title.base?.split("€")[0]) },
                            currentS: { N: Number(title.currentS?.split("€")[0]) }
                        }
                    }
                }))
            }
        };

        try {
            await client.send(new BatchWriteItemCommand(params));
            console.log("Batch write successful");
        } catch (error) {
            console.error("Batch write failed:", error);
        }

    }
};

const chunkArray = (array: Title[], size: any) => {
    return array.reduce((acc: any, _: any, i: any) => {
        if (i % size === 0) acc.push(array.slice(i, i + size));
        return acc;
    }, []);
};
