const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');
const { supabase } = require('./database');

// ─── JWT Utils ───────────────────────────────────────────────
const generateToken = (userId) =>
    jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// ─── Passport Google OAuth ────────────────────────────────────
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const name = profile.displayName;
                const avatar = profile.photos?.[0]?.value;

                // Upsert user no Supabase
                const { data: user, error } = await supabase
                    .from('users')
                    .upsert(
                        {
                            google_id: googleId,
                            email,
                            name,
                            avatar,
                            youtube_access_token: accessToken,
                            youtube_refresh_token: refreshToken,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'google_id', returning: 'representation' }
                    )
                    .select()
                    .single();

                if (error) return done(error, null);
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    done(null, data);
});

module.exports = { passport, generateToken, verifyToken };
