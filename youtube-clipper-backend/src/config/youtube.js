const { google } = require('googleapis');
const axios = require('axios');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const googleYoutube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY || oauth2Client
});

// RapidAPI Shim
const RAPIDAPI_HOST = 'youtube-v3-lite.p.rapidapi.com';
const isRapidApiKey = (key) => key && key.length > 30 && !key.startsWith('AIza');

const handleFallback = async (endpoint, params) => {
    if (endpoint === 'channels' || endpoint === 'videos') {
        const fallbackId = params.id ? (Array.isArray(params.id) ? params.id[0] : params.id) :
            (params.forHandle ? params.forHandle : null);

        if (fallbackId) {
            console.log(`[RapidAPI] Searching for fallback data for: ${fallbackId}`);
            try {
                const searchRes = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
                    params: { q: fallbackId, part: 'snippet', maxResults: 1 },
                    headers: { 'X-RapidAPI-Key': process.env.YOUTUBE_API_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST }
                });
                const item = searchRes.data.items?.[0];
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
            }
        }
    }
    return { data: { items: [] } };
};

const rapidApiRequest = async (endpoint, params) => {
    try {
        console.log(`[RapidAPI] Request to ${endpoint} with params:`, JSON.stringify(params));

        let targetParams = {
            ...params,
            part: Array.isArray(params.part) ? params.part.join(',') : params.part,
            id: Array.isArray(params.id) ? params.id.join(',') : params.id,
        };

        delete targetParams.auth;

        if (endpoint === 'channels' && params.forHandle) {
            const handle = params.forHandle.replace('@', '');
            console.log(`[RapidAPI] forHandle detected: ${handle}, searching for ID...`);
            const searchRes = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
                params: { q: handle, type: 'channel', part: 'snippet', maxResults: 1 },
                headers: { 'X-RapidAPI-Key': process.env.YOUTUBE_API_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST }
            });
            const channelId = searchRes.data.items?.[0]?.id?.channelId;
            if (!channelId) {
                console.log(`[RapidAPI] Channel not found via search for handle ${handle}`);
                return { data: { items: [] } };
            }

            console.log(`[RapidAPI] Found ID ${channelId} for handle ${handle}`);
            targetParams.id = channelId;
            delete targetParams.forHandle;
        }

        const response = await axios.get(`https://${RAPIDAPI_HOST}/${endpoint}`, {
            params: targetParams,
            headers: {
                'X-RapidAPI-Key': process.env.YOUTUBE_API_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
        });

        if (response.data?.error?.code === 403 || response.data?.code === 403) {
            console.log(`[RapidAPI] 403 detected in response body for ${endpoint}, triggering fallback...`);
            return await handleFallback(endpoint, params);
        }

        return { data: response.data };
    } catch (error) {
        if (error.response?.status === 403 || error.response?.data?.code === 403) {
            console.log(`[RapidAPI] 403 HTTP error on ${endpoint}, trying fallback...`);
            return await handleFallback(endpoint, params);
        }
        console.error(`[RapidAPI] Error fetching from ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
};

const youtube = {
    channels: {
        list: (params) => {
            const isRapid = isRapidApiKey(process.env.YOUTUBE_API_KEY);
            const hasOAuth = params.auth && typeof params.auth === 'object' && (params.auth.credentials || params.auth.context);

            if (isRapid && !hasOAuth) {
                return rapidApiRequest('channels', params);
            }
            return googleYoutube.channels.list(params);
        }
    },
    playlistItems: {
        list: (params) => {
            const isRapid = isRapidApiKey(process.env.YOUTUBE_API_KEY);
            const hasOAuth = params.auth && typeof params.auth === 'object' && (params.auth.credentials || params.auth.context);

            if (isRapid && !hasOAuth) {
                return rapidApiRequest('playlistItems', params);
            }
            return googleYoutube.playlistItems.list(params);
        }
    },
    videos: {
        list: (params) => {
            const isRapid = isRapidApiKey(process.env.YOUTUBE_API_KEY);
            const hasOAuth = params.auth && typeof params.auth === 'object' && (params.auth.credentials || params.auth.context);

            if (isRapid && !hasOAuth) {
                return rapidApiRequest('videos', params);
            }
            return googleYoutube.videos.list(params);
        },
        insert: (params, options) => googleYoutube.videos.insert(params, options)
    }
};

module.exports = { youtube, oauth2Client };
