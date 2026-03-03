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

const youtube = {
    channels: {
        list: (params) => {
            return googleYoutube.channels.list(params);
        }
    },
    playlistItems: {
        list: (params) => {
            return googleYoutube.playlistItems.list(params);
        }
    },
    videos: {
        list: (params) => {
            return googleYoutube.videos.list(params);
        },
        insert: (params, options) => googleYoutube.videos.insert(params, options)
    }
};

module.exports = { youtube, oauth2Client };
