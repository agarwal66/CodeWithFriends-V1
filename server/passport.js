// server/passport.js
const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL, // ✅ Yeh line zaroori hai!
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    // Your user logic here
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));