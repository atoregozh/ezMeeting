var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// load up the user model
var User = require('../models/user');
// load the auth variables
var configAuth = require('./auth');

var refresh = require('passport-oauth2-refresh');

module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log("Starting serialization of user");
        // console.log(user);
        done(null, user.id); //id here is mongo/mongoose _id
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        console.log("Starting deserialization of user");
        // console.log("printing id " + id); //id here is mongo/mongoose _id
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // ======================================================
    // GOOGLE ===============================================
    // ======================================================
    var strategy = new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,

    },
    
    function(accessToken, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

        	var picUrl = profile.photos[0].value;
        	if(!picUrl) {
        		// Unlikely to come here because Google sends a blue person as the default pic.
        		picUrl = '/img/default-user-pic.jpg';
        	} else {
        		picUrl = picUrl.replace('sz=50', 'sz=300');
        	}

            var user   =   {
                google: {
                    id : profile.id,
                    accessToken : accessToken,
                    refreshToken : refreshToken
                },
                displayName : profile.displayName,
                name: {
                    firstname  : profile.name.givenName,
                    lastname : profile.name.familyName
                },
                email : profile.emails[0].value, // pull the first email
                pic : picUrl
            };
            User.findOneAndUpdate({ email: user.email }, user, {upsert: true}, function(err, user) {
            	console.log(user);
                // if can't find the user
                if (err) {
                    console.log(err);  // handle errors!
                    return done(err); // done is needed to finish asynchronous procedure of user verification
                } else {   
                    return done(null, user);
                }
            });
        });

    });
    passport.use(strategy);
    refresh.use(strategy);

};
