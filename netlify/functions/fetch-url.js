exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    if (!url) {
        return { statusCode: 400, body: 'No URL provided' };
    }
    try {
        const response = await fetch(url);
        const text = await response.text();
        return { statusCode: 200, body: text };
    } catch (error) {
        return { statusCode: 500, body: 'Fetch error: ' + error.message };
    }
};
