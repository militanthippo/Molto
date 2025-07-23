exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    if (!url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No URL provided' }) };
    }
    try {
        const response = await fetch(url);
        const html = await response.text();
        const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile`;
        const pageSpeedResponse = await fetch(pageSpeedUrl);
        const pageSpeedData = await pageSpeedResponse.json();

        const lcp = pageSpeedData.lighthouseResult.audits['largest-contentful-paint'].numericValue || 0;
        const cls = pageSpeedData.lighthouseResult.audits['cumulative-layout-shift'].numericValue || 0;
        const inp = pageSpeedData.lighthouseResult.audits['interaction-to-next-paint'].numericValue || 0;

        const score = Math.max(0, 100 - (lcp / 100 + cls * 100 + inp / 10));

        return {
            statusCode: 200,
            body: JSON.stringify({
                score: Math.round(score),
                lcp,
                cls,
                inp,
                html // Return HTML for client-side parsing
            })
        };
    } catch (error) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                score: 50,
                lcp: 0,
                cls: 0,
                inp: 0,
                html: '<html></html>',
                error: 'Audit failed. Using fallback data: ' + error.message
            })
        };
    }
};
