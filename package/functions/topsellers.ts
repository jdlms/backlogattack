import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { BatchWriteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

// This is the path to the local Chromium binary
const YOUR_LOCAL_CHROMIUM_PATH =
    "/tmp/localChromium/chromium/mac_arm-1370981/chrome-mac/Chromium.app/Contents/MacOS/Chromium";

const tableName = Resource.Titles.name
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface Game {
    title: string;
    itemKey: string;
    price: string;
}

const writeGamesToDynamo = async (games: Game[]) => {
    // Batch write accepts up to 25 items at a time
    const gameChunks = chunkArray(games, 25);

    for (const gameBatch of gameChunks) {
        const params = {
            RequestItems: {
                [tableName]: gameBatch.map((game: Game) => ({
                    PutRequest: {
                        Item: {
                            itemKey: { S: game.itemKey },
                            title: { S: game.title },
                            price: { S: game.price }
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

const chunkArray = (array: Game[], size: any) => {
    return array.reduce((acc: any, _: any, i: any) => {
        if (i % size === 0) acc.push(array.slice(i, i + size));
        return acc;
    }, []);
};


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

    const gameTitles = await page.$$eval('.search_result_row', rows =>
        rows.slice(0, 20).map(row => ({
            title: row.querySelector('.title')?.textContent?.trim() || '',
            itemKey: row.getAttribute('data-ds-itemkey') || '',
            price: row.querySelector('.discount_final_price')?.textContent?.trim() || '',
        })
        ))

    let res = writeGamesToDynamo(gameTitles);
    console.log(res);
    return {
        statusCode: 200,
        body: gameTitles,
        isBase64Encoded: true,
        headers: {
            "Content-Type": "json",
            "Content-Disposition": "inline",
        },
    };
} 
