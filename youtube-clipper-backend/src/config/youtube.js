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

const rapidHeaders = () => ({
    'X-RapidAPI-Key': process.env.YOUTUBE_API_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
});

const rapidSearch = async (q, type = 'channel') => {
    const res = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
        params: { q, type, part: 'snippet', maxResults: 1 },
        headers: rapidHeaders()
    });
    return res.data.items || [];
};

const rapidApiRequest = async (endpoint, rawParams) => {
    // Normalise arrays -> comma-separated strings and strip auth
    const params = { ...rawParams };
    delete params.auth;
    if (Array.isArray(params.part)) params.part = params.part.join(',');
    if (Array.isArray(params.id)) params.id = params.id.join(',');

    console.log(`[RapidAPI] ${endpoint}`, JSON.stringify(params));

    // Step 1: forHandle → resolve to channelId via search
    let cachedSearchItem = null; // keep the search hit in case /channels is blocked
    if (endpoint === 'channels' && params.forHandle) {
        const handle = String(params.forHandle).replace('@', '');
        console.log(`[RapidAPI] Resolving handle: ${handle}`);
        try {
            const items = await rapidSearch(handle, 'channel');
            const hit = items[0];
            const channelId = hit?.id?.channelId;
            if (!channelId) {
                console.log(`[RapidAPI] Handle not found: ${handle}`);
                return { data: { items: [] } };
            }
            console.log(`[RapidAPI] Handle ${handle} → ${channelId}`);
            cachedSearchItem = hit; // save for fallback below
            params.id = channelId;
            delete params.forHandle;
        } catch (e) {
            console.error(`[RapidAPI] Handle search failed:`, e.message);
            return { data: { items: [] } };
        }
    }

    // Step 2: call the actual endpoint
    let response;
    try {
        response = await axios.get(`https://${RAPIDAPI_HOST}/${endpoint}`, {
            params,
            headers: rapidHeaders()
        });
    } catch (e) {
        const status = e.response?.status;
        const body = e.response?.data;
        console.error(`[RapidAPI] ${endpoint} HTTP ${status}:`, body || e.message);

        // 403 fallback: try search with the id value
        if (status === 403 || body?.code === 403) {
            const fallbackQ = params.id || params.forHandle;
            if (fallbackQ) {
                console.log(`[RapidAPI] 403 fallback search for: ${fallbackQ}`);
                try {
                    const items = await rapidSearch(String(fallbackQ));
                    const item = items[0];
                    if (item) {
                        return {
                            data: {
                                items: [{
                                    id: item.id?.channelId || item.id?.videoId || fallbackQ,
                                    snippet: item.snippet,
                                    statistics: { subscriberCount: '0', videoCount: '0', viewCount: '0' },
                                    contentDetails: { duration: 'PT0S', relatedPlaylists: { uploads: '' } }
                                }]
                            }
                        };
                    }
                } catch (fe) {
                    console.error(`[RapidAPI] Fallback search failed:`, fe.message);
                }
            }
        }
        throw e;
    }

    // Step 3: 403 may come as 200 with error body
    if (response.data?.error?.code === 403 || response.data?.code === 403) {
        console.log(`[RapidAPI] 403 in response body for ${endpoint}`);
        // If we have cached data from the handle search, use it
        if (cachedSearchItem) {
            console.log(`[RapidAPI] Serving cached search hit instead`);
            const sn = cachedSearchItem.snippet || {};
            return {
                data: {
                    items: [{
                        id: cachedSearchItem.id?.channelId || params.id,
                        snippet: {
                            ...sn,
                            title: sn.channelTitle || sn.title || 'Unknown Channel',
                            description: sn.description || '',
                            thumbnails: sn.thumbnails || {}
                        },
                        statistics: { subscriberCount: '0', videoCount: '0', viewCount: '0' },
                        contentDetails: { duration: 'PT0S', relatedPlaylists: { uploads: '' } }
                    }]
                }
            };
        }
        return { data: { items: [] } };
    }

    return { data: response.data };
};

const youtube = {
    channels: {
        list: (params) => {
            const isRapid = isRapidApiKey(process.env.YOUTUBE_API_KEY);
            const hasOAuth = params.auth && typeof params.auth === 'object' && (params.auth.credentials || params.auth.context);
            if (isRapid && !hasOAuth) return rapidApiRequest('channels', params);
            return googleYoutube.channels.list(params);
        }
    },
    playlistItems: {
        list: (params) => {
            const isRapid = isRapidApiKey(process.env.YOUTUBE_API_KEY);
            const hasOAuth = params.auth && typeof params.auth === 'object' && (params.auth.credentials || params.auth.context);
            if (isRapid && !hasOAuth) return rapidApiRequest('playlistItems', params);
            return googleYoutube.playlistItems.list(params);
        }
    },
    videos: {
        list: (params) => {
            const isRapid = isRapidApiKey(process.env.YOUTUBE_API_KEY);
            const hasOAuth = params.auth && typeof params.auth === 'object' && (params.auth.credentials || params.auth.context);
            if (isRapid && !hasOAuth) return rapidApiRequest('videos', params);
            return googleYoutube.videos.list(params);
        },
        insert: (params, options) => googleYoutube.videos.insert(params, options)
    }
};

module.exports = { youtube, oauth2Client };
