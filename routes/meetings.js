var express = require('express');
var router = express.Router();
var needle = require('needle');
var refresh = require('passport-oauth2-refresh');
var User = require('../models/user');
var Meeting = require('../models/meeting');
var moment = require('moment');
var mongoose = require('mongoose');

// Handler for POST requests to /meetings
router.post('/', function(req, res, next) {
  //@DEBUG console.log('ip2>>>>', req.connection.remoteAddress); this is to see where does the request coming from
  inviteToMeeting(req, res);
});

// Handler to render meetings
router.get('/newmeeting', ensureAuthenticated, function(req, res, next) {
  res.render('meetings', {user: req.user,'title':'Create new meeting'});
});

//this route should be in calendar.js
router.get('/all', function(req, res) {
  getGCalendarEventsPerUser(req, res);
});

// Handler for DELETE requests to /meetings/:id
router.delete('/:id', function(req, res) {
  var id = req.params.id;
  

});



// Handler for GET requests to /meetings/:id
router.get('/:id', function(req, res, next) {
   var meetingJson = {};
   
   var id = req.params.id;
   Meeting.find({ googleId: id }, function(err, meeting) {
    if(err || !meeting) { 
      console.log('heres the meeting from db');
      console.log(meeting);
      console.log('*****************');
      console.log('problems with finding meeting in db; errors! Heres the error:');
      console.log(err);
    } else {
      //start constructing json for response
      meetingJson = {
        "googleId": meeting.googleId,
        "name": meeting.name,
        "startTime": meeting.startTime,
        "endTime": meeting.endTime,
        "description": meeting.description,
        "location": meeting.location,
        "organizer": {
          id: meeting.organizerId.toString(),
          name: meeting.organizerId.displayName,
          pic: meeting.organizerId.pic
        },
        "participants": [
        ]
      };
      
      var participantsArrOfIds = meeting.participants;
      for ( var i = 0; i < participantsArrOfIds.length; i++) {
        var pId = participantsArrOfIds[i];

        meetingJson.push({
          "id": pId.toString(),
          "name": pId.name,
          "pic": pId.pic
        });
      }
    } //end else
  }); // end find from db
  res.send(meetingJson);
});

function inviteToMeeting(req, res) {
  /*
  * receive data from ajax req.data
  * reformat the json to fit google's api
  * send post request to google calendar
  */
  console.log('starting out inviteToMeeting');
  var send401Response = function() {
    return res.status(401).end();
  };

  //prepare array or participant ids from request json
  var participantIDs =[];
  for ( var i = 0; i < req.body.participants.length; i++) {//req.body.participants is json object that has name and id
    var p = req.body.participants[i];
    participantIDs.push(p.id);
  }

  //find attendee emails from db based on the participant id
  var participantEmails = [];
  User.
  where('_id').in(participantIDs).
  exec(function(err, participantDocs){ //assumption that participantDocs is array of type User
    if (err) {
      console.log(err);  // handle errors!
      return send401Response();   // problems with finding participant docs in db; errors!
    } else {  
      console.log('getting participant docs'); 
      for (var i = 0; i < participantDocs.length; i++) {
        var participant = participantDocs[i]; //participant is User document
        participantEmails.push(participant.email);
        console.log('Found ' + participant._id + ' with ' + participant.email); 
      }

      // start building request object for google
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
          //fill this in below
        ],
        "reminders": {
          "useDefault": false,
          "overrides": [
            {"method": "email", 'minutes': 60},
            {"method": "popup", 'minutes': 20},
          ],
        },
        "organizer": {
          "displayName": req.body.organizer.name
        }
      };
      //not done with building request object yet, fill attendees array with emails
      for (var j = 0; j < participantEmails.length; j++) {
        var email = participantEmails[j];
        event.attendees.push( {'email': email} );
      }
      
      // find organizer and get his/her google accessToken
      organizerId = req.body.organizer.id;
      User.findById(organizerId, function(err, organizer) {
        if(err || !organizer) { 
          console.log('heres the organizer from db');
          console.log(organizer);
          console.log('*****************');
          console.log('problems with finding organizer (user) in db; errors! Heres the error:');
          console.log(err);
          return send401Response();   // problems with finding user in db; errors!
        }
        var retries = 2;
        var makeRequest = function() {
          console.log('retries is now ' + retries);
          retries--;
          if(!retries) {
            // Couldn't refresh the access token.
            console.log('thres no more retries left');
            return send401Response();
          }
          
          //add organizer email to event
          event.organizer.email = organizer.email;

          var url = 'https://www.googleapis.com/calendar/v3/calendars/'+organizer.email+'/events'+
                    '?sendNotifications=true';

          var options = {
            headers: {
              Authorization: 'Bearer '+ organizer.google.accessToken
            },
            json: true 
          };

          console.log(url);
          console.log('user access Token before calling processCreatedMeeting: ' + organizer.google.accessToken);
          console.log('user refresh Token before calling processCreatedMeeting: ' + organizer.google.refreshToken);
          needle.post(url, event, options, function(error, response) {
              if (!error && response.statusCode == 200) {

                console.log('Success! event has created!');
                console.log('this google id needs to be saved:');
                console.log(response.body.id);
                console.log("*******************");
                console.log(response.body);
                console.log("*******************");
                console.log('Returning from inviteToMeeting()');
                console.log('Calling processCreatedMeeting()');
                processCreatedMeeting(participantIDs, organizerId, response.body);
                console.log('Done with processCreatedMeeting()');
                console.log('Sending Meeting ID back to Client');
                res.send({"googleId": response.body.id} );

              } else if (response.statusCode === 401) {
              // Access token expired.
              // Try to fetch a new one.
                refreshAccessToken(organizer,makeRequest);
              } else {
                // There was another error, handle it appropriately.
                console.log('some other error happened');
                console.log(response.body);
                res.sendStatus(response.statusCode);
              }   
            }); //needle.post ends here
          }; //makeRequest ends here
          makeRequest();
        }); //User.findById ends here
      } //else
  }); //finish finding participantEmails
}

function processCreatedMeeting(participantIDs, organizerId, res) {
  /*processCreatedMeeting:
    * save meeting to db
  */
  var newMeeting = new Meeting();
  // set all of the relevant information
  newMeeting.googleId = res.id;
  newMeeting.name = res.summary;
  newMeeting.isActive = true;
  newMeeting.isDeleted = false;
  newMeeting.startTime = res.start.dateTime;
  newMeeting.endTime = res.end.dateTime;
  newMeeting.description = res.description;
  newMeeting.location = res.location;
  newMeeting.organizerId = new mongoose.Types.ObjectId(organizerId);
  newMeeting.isInternal = true;

  participantObjectIds = [];
  console.log('Converting participant IDs from String to ObjectId');
  for (var i = 0; i < participantIDs.length; i++) {
    var stringId = participantIDs[i];
    var objectId = new mongoose.Types.ObjectId(stringId);
    participantObjectIds.push(objectId);
  } 

  newMeeting.participants = participantObjectIds;

  // save the meeting to database
  // save is mongoose command
  console.log('Starting to save newMeeting into db');
  newMeeting.save(function(err, res) {
    if (err) {
        console.log(err);  // handle errors!
        throw err;
    } else { 
        console.log('Saved newmeeting to db successfully'); 
        console.log('Calling addMeetingToUsers'); 

        addMeetingToUsers(participantObjectIds,res._id);
    }
  });
}

function addMeetingToUsers(participantObjectIds, meetingId) {
  User.update({ _id: { $in: participantObjectIds }}, { $push: { meetings: meetingId }}, {multi: true}, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      return;
    }
  });

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
    console.log(user);
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
    console.log('user access Token is: ' + user.google.accessToken);
    console.log('user refresh Token is: ' + user.google.refreshToken);
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
  console.log('refresh token used to be:' + user.google.refreshToken);
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
          console.log('now refresh token is ' + user.google.refreshToken);
          functiontoRepeat();
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
