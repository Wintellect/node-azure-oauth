
var passport = require('passport');

module.exports.getPassport = function(config, oauth, User) {

    // hook to serialize in-memory user to session cookie
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // hook to deserialize session cookie to in-memory user (pulled from mongo)
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // configure passport to use our Azure-specific OAuth2 strategy
    passport.use(oauth.getStrategy(config, User));

    return passport;
};
