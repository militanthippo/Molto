const { getLighthouse } = await import('lighthouse');
const chromium = await import('@sparticuz/chromium');

exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    if (!url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No URL provided' }) };
    }
    try {
        const chrome = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const lighthouse = await getLighthouse();
        const options = {
            logLevel: 'error', // Reduce logs to minimize overhead
            onlyCategories: ['performance'],
            port: chrome.port,
            disableStorageReset: true, // Skip storage reset for speed
            output: 'json', // No HTML report
        };
        const runnerResult = await lighthouse(url, options, null, chrome);
        await chrome.close();

        const lcp = runnerResult.lhr.audits['largest-contentful-paint']?.numericValue || 0;
        const cls = runnerResult.lhr.audits['cumulative-layout-shift']?.numericValue || 0;
        const inp = runnerResult.lhr.audits['interaction-to-next-paint']?.numericValue || 0;

        const score = Math.max(0, 100 - (lcp / 100 + cls * 100 + inp / 10));

        return {
            statusCode: 200,
            body: JSON.stringify({
                score: Math.round(score),
                lcp,
                cls,
                inp
            })
        };
    } catch (error) {
        console.error('Lighthouse error:', error.message);
        return {
            statusCode: 200,
            body: JSON.stringify({
                score: 50, // Default fallback score
                lcp: 0,
                cls: 0,
                inp: 0,
                error: 'Audit failed due to server constraints. Using fallback data.'
            })
        };
    }
};
