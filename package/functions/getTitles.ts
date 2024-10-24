import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { BatchWriteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import Chromium from "@sparticuz/chromium";
import { split } from "postcss/lib/list";
import { map } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { replace } from "@remix-run/react";

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

            const originalPriceElement = row.querySelector('.discount_original_price');
            const finalPriceElement = row.querySelector('.discount_final_price');

            const basePrice = originalPriceElement
                ? originalPriceElement.textContent?.trim()
                : finalPriceElement?.textContent?.trim();

            const currentPrice = finalPriceElement
                ? finalPriceElement.textContent?.trim()
                : '';

            return {
                itemKey: row.getAttribute('data-ds-itemkey') || '',
                title: row.querySelector('.title')?.textContent?.trim() || '',
                imgUrl: row.querySelector('.search_capsule img')?.getAttribute('src') || '',
                base: basePrice,
                currentS: currentPrice
            };
        })
    );

    console.log(titles);
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
        const filteredTitles = titleBatch.filter((title: any) => title.base !== "Free")

        const numericalPrices = filteredTitles.map((title: any) => {
            const basePrice = title.base.split("€")[0].replace(',', '.').trim();
            const currentPrice = title.currentS.split("€")[0].replace(',', '.').trim();

            return {
                ...title,
                base: basePrice,
                currentS: currentPrice
            };
        })

        console.log(numericalPrices);
        const params = {
            RequestItems: {
                [tableName]: numericalPrices.map((title: any) => ({
                    PutRequest: {
                        Item: {
                            itemKey: { S: title.itemKey },
                            title: { S: title.title },
                            imgUrl: { S: title.imgUrl },
                            base: { N: title.base },
                            currentS: { N: title.currentS }
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
