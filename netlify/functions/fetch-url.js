const lighthouse = require('lighthouse');
const chromium = require('@sparticuz/chromium');

exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    if (!url) {
        return { statusCode: 400, body: 'No URL provided' };
    }
    try {
        const chrome = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const options = {logLevel: 'info', output: 'json', onlyCategories: ['performance'], port: chrome.port};
        const runnerResult = await lighthouse(url, options);
        await chrome.kill();

        const lcp = runnerResult.lhr.audits['largest-contentful-paint'].numericValue || 0;
        const cls = runnerResult.lhr.audits['cumulative-layout-shift'].numericValue || 0;
        const inp = runnerResult.lhr.audits['interaction-to-next-paint'].numericValue || 0;

        // Simple score calculation based on metrics (lower is better, max 100)
        const score = Math.max(0, 100 - (lcp / 100 + cls * 100 + inp / 10));

        return {
            statusCode: 200,
            body: JSON.stringify({
                score: Math.round(score),
                lcp,
                cls,
                inp,
                report: runnerResult.report // Full JSON report if needed
            })
        };
    } catch (error) {
        return { statusCode: 500, body: 'Error: ' + error.message };
    }
};
