
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

module.exports.getStrategy = function(config, User) {
    var strategy = new OAuth2Strategy({
            authorizationURL: config.authUrl,   // first part of oauth2 handshake
            tokenURL: config.tokenUrl,          // second part of oauth2 handshake
            clientID: config.clientId,          // uniquely identifies your Azure application
            clientSecret: config.clientSecret,  // app-specific generated secret
            callbackURL: config.callbackUrl     // invoked by Azure upon auth sequence completion
        },
        // this method is invoked upon auth sequence completion
        //  its your hook to cache the access/refresh tokens, post-process the Azure profile, etc.
        function (accessToken, refreshToken, profile, done) {
            // here we look in mongo for an existing, matching user
            User.findOne({ email: profile.email }, function(err, user) {
                if (err) {
                    return done(err);
                }
                // if we don't find an existing user, make one
                if (!user) {
                    User.create({ email: profile.email, name: profile.displayname, logins: 1 }, function(err, user) {
                        return done(null, user);
                    });
                } else {
                    // else update the existing user and party on
                    user.logins = user.logins + 1;
                    user.save(function(err, user) {
                        return done(null, user);
                    });
                }
            });
        });

    // Azure AD requires an additional 'resource' parameter for the token request
    //  this corresponds to the Azure resource you're requesting access to
    //  in our case we're just trying to authenticate, so we just request generic access to the Azure AD graph API
    strategy.tokenParams = function(options) {
        return { resource: config.resource };
    };

    // this is our custom logic for digging into the token returned to us by Azure
    //  in raw form its base64 text and we want the corresponding JSON
    strategy.userProfile = function(accessToken, done) {
        // thx: https://github.com/QuePort/passport-azure-oauth/blob/master/lib/passport-azure-oauth/strategy.js
        var profile = {};
        try {
            var tokenBase64 = accessToken.split('.')[1];
            var tokenBinary = new Buffer(tokenBase64, 'base64');
            var tokenAscii = tokenBinary.toString('ascii');
            var tokenObj = JSON.parse(tokenAscii);
            profile.json = tokenObj;
            profile.email = tokenObj.email;
            profile.displayname = tokenObj.given_name + ' ' + tokenObj.family_name;
            done(null, profile);
        } catch (ex) {
            console.log("Unable to parse oauth2 token from WAAD.");
            done(ex, null);
        }
    };

    return strategy;
};
