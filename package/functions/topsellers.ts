import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// This is the path to the local Chromium binary
const YOUR_LOCAL_CHROMIUM_PATH =
    "/tmp/localChromium/chromium/mac_arm-1368358/chrome-mac/Chromium.app/Contents/MacOS/Chromium";

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

    const gameTitles = await page.$$eval('.search_result_row .title', titles =>
        titles.slice(0, 20).map(title => title.textContent?.trim())
    );

    console.log(gameTitles);

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
