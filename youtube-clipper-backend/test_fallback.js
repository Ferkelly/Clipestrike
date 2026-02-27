require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_HOST = 'youtube-v3-lite.p.rapidapi.com';
const API_KEY = process.env.YOUTUBE_API_KEY;

const handleFallback = async (endpoint, params) => {
    if (endpoint === 'channels' || endpoint === 'videos') {
        const fallbackId = params.id ? (Array.isArray(params.id) ? params.id[0] : params.id) :
            (params.forHandle ? params.forHandle : null);

        if (fallbackId) {
            console.log(`[RapidAPI] Searching for fallback data for: ${fallbackId}`);
            try {
                const searchRes = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
                    params: { q: fallbackId, part: 'snippet', maxResults: 1 },
                    headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST }
                });
                const item = searchRes.data.items?.[0];
                console.log("Search Result:", item);
                if (item) {
                    console.log(`[RapidAPI] Fallback successful for: ${fallbackId}`);
                    return {
                        data: {
                            items: [{
                                id: item.id?.channelId || item.id?.videoId || fallbackId,
                                snippet: item.snippet,
                                statistics: { subscriberCount: '0', videoCount: '0', viewCount: '0' },
                                contentDetails: { duration: 'PT0S', relatedPlaylists: { uploads: '' } }
                            }]
                        }
                    };
                }
            } catch (err) {
                console.error(`[RapidAPI] Fallback failed:`, err.message);
                if (err.response) console.error("Response data:", err.response.data);
            }
        }
    }
    return { data: { items: [] } };
};

console.log("Testing fallback with handle...");
handleFallback('channels', { forHandle: 'LiveSpeedy' }).then(console.log).catch(console.error);
