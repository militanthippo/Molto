<script>
exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    if (!url) {
        console.error('No URL provided');
        return { statusCode: 400, body: JSON.stringify({ error: 'No URL provided' }) };
    }
    try {
        const apiKey = process.env.PAGESPEED_API_KEY;
        if (!apiKey) {
            console.error('Missing PAGESPEED_API_KEY');
            return { statusCode: 200, body: JSON.stringify({ score: 50, lcp: 0, cls: 0, inp: 0, error: 'Missing API key configuration' }) };
        }
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=PERFORMANCE&strategy=mobile`;
        console.log('Fetching PageSpeed API:', apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`PageSpeed API error: ${response.status} ${response.statusText}`);
            throw new Error(`PageSpeed API failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('PageSpeed API response:', JSON.stringify(data, null, 2));
        const lcp = data.lighthouseResult?.audits['largest-contentful-paint']?.numericValue || 0;
        const cls = data.lighthouseResult?.audits['cumulative-layout-shift']?.numericValue || 0;
        const inp = data.lighthouseResult?.audits['interaction-to-next-paint']?.numericValue || 0;
        const score = (data.lighthouseResult?.categories?.performance?.score * 100) || 50;
        const htmlResponse = await fetch(url);
        const html = await htmlResponse.text();
        return {
            statusCode: 200,
            body: JSON.stringify({
                score: Math.round(score),
                lcp,
                cls,
                inp,
                html
            })
        };
    } catch (error) {
        console.error('PageSpeed error:', error.message);
        return {
            statusCode: 200,
            body: JSON.stringify({
                score: 50,
                lcp: 0,
                cls: 0,
                inp: 0,
                html: '<html></html>',
                error: `Audit failed: ${error.message}`
            })
        };
    }
};
</script>
