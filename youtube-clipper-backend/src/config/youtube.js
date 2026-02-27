const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
});

module.exports = { youtube, oauth2Client };
