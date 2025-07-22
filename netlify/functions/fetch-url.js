const { launch } = require('chrome-aws-lambda');
const lighthouse = require('lighthouse');

exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    if (!url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No URL provided' }) };
    }
    try {
        const browser = await launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const options = {
            logLevel: 'error',
            onlyCategories: ['performance'],
            port: (new URL(browser.wsEndpoint())).port,
            output: 'json',
        };
        const { lhr } = await lighthouse(url, options, null);
        await browser.close();

        const lcp = lhr.audits['largest-contentful-paint']?.numericValue || 0;
        const cls = lhr.audits['cumulative-layout-shift']?.numericValue || 0;
        const inp = lhr.audits['interaction-to-next-paint']?.numericValue || 0;

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
                score: 50,
                lcp: 0,
                cls: 0,
                inp: 0,
                error: 'Audit failed due to server constraints. Using fallback data.'
            })
        };
    }
};
