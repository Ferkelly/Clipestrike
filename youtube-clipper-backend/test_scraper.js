const axios = require('axios');
const getChannelId = async (handle) => {
    const url = 'https://www.youtube.com/@' + handle;
    console.log('Fetching', url);
    const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const match = res.data.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);
    console.log('Result:', match ? match[1] : 'not found');
};
getChannelId('LiveSpeedy');
