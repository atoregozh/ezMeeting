var express = require('express');
var router = express.Router();
var needle = require('needle');
var refresh = require('passport-oauth2-refresh');
var User = require('../models/user');
var moment = require('moment');

// Handler for POST requests to /events
router.post('/', function(req, res, next) {
  // 1. receive data from ajax req.data
  // 2. reformat the json to fit google's api
  // 3. send post request to google calendar
            console.log('ip2>>>>', req.connection.remoteAddress);
  inviteToMeeting(req, res);
  // 4. save meeting to db
	//res.send('Received POST request for /events');
});

router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('meetings', {user: req.user,'title':'Create new meeting'});
});

router.get('/all', function(req, res) {
  getGCalendarEventsPerUser(req, res);
}); //router.get('/all'... ends here

function inviteToMeeting(req, res) {
  var retries = 2;
  console.log('starting out inviteToMeeting');
  var send401Response = function() {
    return res.status(401).end();
  };

  // Get the user's credentials.
  console.log('here is req.session');
  console.log(req.session);
  console.log('here are user credentials from req.session');
  console.log(req.session.logged_user_email); 
  console.log('*****************');
  console.log('body: ', req.body)
  User.findOne({'email': req.session.logged_user_email}, function(err, user) {
    if(err || !user) { 
      console.log('heres the user');
      console.log(user);
      console.log('*****************');
      console.log('problems with finding user in db; errors! Heres the error:');
      console.log(err);
      return send401Response();   // problems with finding user in db; errors!
    }

    var makeRequest = function() {
      retries--;
      if(!retries) {
        // Couldn't refresh the access token.
        return send401Response();
      }
    
    //find emails from database
    var email1 = "toregozh@gmail.com";
    var email2 = "kesiena115@gmail.com";

    var event = {
    "summary": req.body.name,
    "location": req.body.location,
    "description": req.body.description,
    "start": {
      "dateTime": req.body.startTime
    },
    "end": {
      "dateTime": req.body.endTime
    },
    "attendees": [
      {"email": email1},
      {"email": email2},
    ],
    "reminders": {
      "useDefault": false,
      "overrides": [
        {"method": "email", 'minutes': 60},
        {"method": "popup", 'minutes': 20},
      ],
    },
    "organizer": {
      "email": email1,
      "displayName": req.body.organizer.name
    }
  };

    var url = 'https://www.googleapis.com/calendar/v3/calendars/'+user.email+'/events'+
              '?sendNotifications=true';

    var options = {
      headers: {
        Authorization: 'Bearer '+ user.google.accessToken
      },
      json: true 
    };

    console.log(url);
    needle.post(url, event, options, function(error, response) {
        if (!error && response.statusCode == 200) {

          console.log('Success! event has created!');
          console.log('this google id needs to be saved:');
          console.log(response.body.id);
          console.log("*******************");
          console.log(response.body);

        } else if (response.statusCode === 401) {
        // Access token expired.
        // Try to fetch a new one.
          refreshAccessToken(user,makeRequest);
        } else {
          // There was another error, handle it appropriately.
          console.log('some other error happened');
          console.log(response.body);
          res.sendStatus(response.statusCode);
        }   
      }); //end needle get
    };
    makeRequest();
  }); //User.findById ends here

}

function getGCalendarEventsPerUser(req, res) {
  var retries = 2;
  console.log('starting out getGCalendarEventsPerUser');
  var send401Response = function() {
    return res.status(401).end();
  };

  // Get the user's credentials.
  console.log('finding users credentials');
  User.findById(req.user, function(err, user) {
    if(err || !user) { 
      return send401Response();   // problems with finding user in db; errors!
    }

    var makeRequest = function() {
      retries--;
      if(!retries) {
        // Couldn't refresh the access token.
        return send401Response();
      }
    
    var now = moment().toISOString();
    console.log('Now ' + now);
    var yearFromNow = moment().add(1,'y').toISOString();
    console.log('YearFromNow ' + yearFromNow);

    var url = 'https://www.googleapis.com/calendar/v3/calendars/'+user.email+'/events'+
              '?orderBy=startTime&singleEvents=true&timeMax='+yearFromNow+'&timeMin='+now;
    console.log(url);
    needle.get(url, 
              { headers: { Authorization: 'Bearer '+ user.google.accessToken } },  
      function(error, response) {
        if (!error && response.statusCode == 200) {

          console.log('Success! calling filterUserCalData()');
          var jsonUserMap = filterUserCalData(user,response.body);
          res.send(jsonUserMap);
        } else if (response.statusCode === 401) {
        // Access token expired.
        // Try to fetch a new one.
          refreshAccessToken(user,makeRequest);
        } else {
          // There was another error, handle it appropriately.
          console.log('some other error happened');
          console.log(response.body);
          res.sendStatus(response.statusCode);
        }   
      }); //end needle get
    };
    makeRequest();
  }); //User.findById ends here
}

function refreshAccessToken(user, functiontoRepeat) {
  refresh.requestNewAccessToken('google', user.google.refreshToken, 
    function(err, accessToken) {
      if (err || !accessToken) {
        console.log('error! couldnt refresh the token!'); //couldn't refresh the token
        return res.status(401).end(); 
      }

      // Save the new accessToken for future use
      user.save( { google: { accessToken: accessToken} }, function(err) {
        if (err) {
          console.log('problems with saving new accessToken to db!');
          console.log(err);  // problems with saving into db; errors!
          throw err;
        } else {   
          // Retry the request.
          console.log('calling makeRequest again');
          functiontoRepeat;
        }
      });
    });
}

function filterUserCalData(user,data) {
  // console.log('Heres the json data');
  // console.log(data);
  // console.log('xxxxxxxxxxxxxxxxxxxxxxxx');
  var filteredJsonArr = [];
  for( var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    if (( item.start.dateTime === null ) || (typeof(item.start.dateTime) == 'undefined') &&
      (typeof(item.end.dateTime) == 'undefined' || item.end.Time === null)) {
      continue;
    } else {

      filteredJsonArr.push(
        {
          id: item.id,
          ownerId: user._id, // Same as userId if this event was created by this user.
          name: item.summary,
          startTime: item.start.dateTime, 
          endTime: item.end.dateTime,
          isInternal: false, // False means it came from Google calendar or another external source
          externalId: item.id // Would be empty if this event was generated by us.
        } 
      );
      
    }
    
  }
  console.log('Heres the json array');
  console.log(filteredJsonArr);
  var userMap = {userId: user.google.id , events: filteredJsonArr};
  return userMap;

}
  
// route middleware to make sure a user is logged in
function ensureAuthenticated(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


module.exports = router;
