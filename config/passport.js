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
                pic : profile.photos[0].value
            };
            console.log("found a user");
            User.findOneAndUpdate({ email: user.email }, user, {upsert: true}, function(err, user) {
                // if can't find the user
                if (err) {
                    console.log(err);  // handle errors!
                    return done(err); // done is needed to finish asynchronous procedure of user verification
                } else {   
                    return done(null, user);
                }
            });
            console.log("wrote user to db");

            // // try to find the user in our database based on their google id
            // User.findOne({ 'googleID' : profile.id }, function(err, user) {
            //     // if can't find the user
            //     if (err) {
            //         console.log(err);  // handle errors!
            //         return done(err); // done is needed to finish asynchronous procedure of user verification
            //     }
            //     // if a user is found, log them in  
            //     if (!err && user !== null) {
            //         console.log("user already in db");
            //         return done(null, user);
            //     } else {
            //         // if the user isnt in our database, create a new user
            //         var newUser = new User();

            //         // set all of the relevant information
            //         newUser.google.id    = profile.id;
            //         newUser.google.accessToken = accessToken;
            //         newUser.google.refreshToken = refreshToken;
            //         newUser.displayName = profile.displayName;
            //         newUser.name.firstname  = profile.name.givenName;
            //         newUser.name.lastname = profile.name.familyName;
            //         newUser.email = profile.emails[0].value; // pull the first email
            //         newUser.pic = profile.photos[0].value;
            //         console.log("Creating a New User in db:");
            //         console.log(newUser);
                    
                    
            //         // save the user to database
            //         // save is mongoose command
            //         newUser.save(function(err) {
            //             if (err) {
            //                 console.log(err);  // handle errors!
            //                 throw err;
            //             } else {   
            //                 return done(null, newUser);
            //             }
            //         });
            //     }
            // });
        });

    });
    console.log('using given strategy');
    console.log('using passport');
    passport.use(strategy);
    console.log('using refresh');
    refresh.use(strategy);

};
