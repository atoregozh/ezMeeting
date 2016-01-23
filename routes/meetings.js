var express = require('express');
var router = express.Router();
var needle = require('needle');
var google = require('googleapis');
var refresh = require('passport-oauth2-refresh');
var User = require('../models/user');
var configAuth = require('../config/auth');

// Handler for POST requests to /events
router.post('/', function(req, res, next) {
	res.send('Received POST request for /events');
  // save the card to db req.data get data from ajax
});

router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('meetings', {'title':'Create new meeting'});
});

router.get('/all', function(req, res) {
  //var retries = 2;

  var send401Response = function() {
    return res.status(401).end();
  };

  // Get the user's credentials.
  User.findById(req.user, function(err, user) {
    if(err || !user) { 
      console.log(err);  // problems with finding user in db; errors!
      throw err; 
    }

    // var url = 'https://www.googleapis.com/calendar/v3'+path+'?access_token='+access_token;
    // needle.get('https://www.googleapis.com/calendar/v3/calendars/toregozh%40gmail.com/events', 
    // {headers: {Authorization: 'Bearer '+ req.session.access_token}},  function(error, response) {
    // if (!error && response.statusCode == 200)
    //   console.log(response.body);
    // res.send(response.body);
  });
    

    // var makeRequest = function() {
    //   retries--;
    //   if(!retries) {
    //     // Couldn't refresh the access token.
    //     return send401Response();
    //   }

      // Set the credentials and make the request.
      var OAuth2 = google.auth.OAuth2;
      var oauth2Client = new OAuth2(
              configAuth.googleAuth.clientID, 
              configAuth.googleAuth.clientSecret, 
              configAuth.googleAuth.callbackURL);
      oauth2Client.setCredentials({
        access_token: user.google.accessToken,
        refresh_token: user.google.refreshToken
      });
        console.log("from within meeting.js. Here's accessToken:");
        console.log(user.google.accessToken);
        console.log("from within meeting.js. Here's responseToken:");
        console.log(user.google.refreshToken);

      var googleCal = google.calendar('v3');
      googleCal.events.list({
        calendarId: user.email,
        orderBy: 'startTime',
        timeMin: (new Date()).toISOString(),
        singleEvents: true,
        fields: 'items(end,start,summary,description,location)'
      })
      .withAuthClient(OAuth2)
      .execute(function(error, response) {
        console.log('getting into success');
        if (!error && response.statusCode === 200) {
          // Success! Do something with the response
            res.send(response.body);
        console.log('nope not success, getting into else if block');
        } else if (response.statusCode === 401) {
          // Access token expired.
          // Try to fetch a new one.
          refresh.requestNewAccessToken('google', user.refreshToken, function(err, accessToken) {
            if (err || !accessToken) {
              return send401Response(); 
            }

            // Save the new accessToken for future use
            user.save( { accessToken: accessToken }, function(err) {
              if (err) {
                console.log(err);  // problems with saving into db; errors!
                throw err;
              } else {   
                // Retry the request.
                makeRequest();
              }
            });
          });
        } else {
          // There was another error, handle it appropriately.
          console.log(response.body);
          res.send(response.body);
          //return res.status(response.statusCode).json(reason.message);
        }
      });//  googleCal.events.list ends here
    // }; //makerequest ends here
    // makeRequest();
  }); //User.findById ends here
  // console.log('');
  // console.log(req.session.access_token);
  // needle.get('https://www.googleapis.com/calendar/v3/calendars/toregozh%40gmail.com/events', 
  //   {headers: {Authorization: 'Bearer '+ req.session.access_token}},  function(error, response) {
  //   if (!error && response.statusCode == 200)
  //     console.log(response.body);
  //   res.send(response.body);
  // });
}); //router.get('/all'... ends here

// route middleware to make sure a user is logged in
function ensureAuthenticated(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


// // GET events listing
// router.get('/', function(req, res, next) {
//  	res.send('Received GET request for /events');
// });

module.exports = router;
