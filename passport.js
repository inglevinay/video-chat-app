
const passport =require("passport")
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
        done(null, user);
});

passport.use(new GoogleStrategy({
        clientID:"925985326450-9tcelvnhdrpfuk8gqtk0i6fr14j7aduu.apps.googleusercontent.com",
        clientSecret:"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",
        callbackURL: "https://video-chat-appppp.herokuapp.com/" + "/google/callback",
        passReqToCallback   : true
    },
    function(request, accessToken, refreshToken, profile, done) {
            return done(null, profile);
    }
));
