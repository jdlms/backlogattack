import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { BatchWriteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import * as cheerio from 'cheerio';

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
    // number of titles to retrieve
    const titleCount = 250;

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
    await page.goto(url);

    let allTitles: any = [];

    // First page
    const initialTitles = extractTitlesFromHTML(await page.content());
    allTitles = allTitles.concat(initialTitles);

    let start = 50;

    while (allTitles.length < 250) {
        const moreTitlesHTML = await fetchAdditionalTitles(page, start, titleCount);
        const moreTitles = extractTitlesFromHTML(moreTitlesHTML);

        allTitles = allTitles.concat(moreTitles);

        if (allTitles.length >= 250) break;

        // Adjust start by the number of titles actually fetched
        start += moreTitles.length;
    }

    console.log(`Total titles scraped: ${allTitles.length}`);

    // Write to DynamoDB
    await writeGamesToDynamo(allTitles);

    await browser.close();

    console.log("Success!");
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Titles successfully scraped and written to DynamoDB",
        }),
        headers: {
            "Content-Type": "application/json",
        },
    };
}

const extractTitlesFromHTML = (htmlContent: string) => {
    // Load content into Cheerio
    const $ = cheerio.load(htmlContent);

    return $('.search_result_row').map((_, row) => {
        const originalPriceElement = $(row).find('.discount_original_price');
        const finalPriceElement = $(row).find('.discount_final_price');

        const basePrice = originalPriceElement.length
            ? originalPriceElement.text().trim()
            : finalPriceElement.text().trim();

        const currentPrice = finalPriceElement.length
            ? finalPriceElement.text().trim()
            : '';

        return {
            itemKey: $(row).attr('data-ds-itemkey') || '',
            title: $(row).find('.title').text().trim() || '',
            imgUrl: $(row).find('.search_capsule img').attr('src') || '',
            base: basePrice,
            currentS: currentPrice
        };
        // convert Cheerio object to an array
    }).get();
};

const fetchAdditionalTitles = async (page: any, start: number, count: number) => {
    const apiUrl = `https://store.steampowered.com/search/results/?query&start=${start}&count=${count}&dynamic_data=&sort_by=_ASC&supportedlang=english&snr=1_7_7_7000_7&filter=topsellers&infinite=1`;
    const response = await page.evaluate(async (url: any) => {
        const res = await fetch(url);
        return await res.json();
    }, apiUrl);

    return response.results_html;
};

// Write titles to table
const writeGamesToDynamo = async (titles: any) => {
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
        });

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

// Chunck array helper
const chunkArray = (array: any[], size: number) => {
    return array.reduce((acc, _, i) => {
        if (i % size === 0) acc.push(array.slice(i, i + size));
        return acc;
    }, []);
};
