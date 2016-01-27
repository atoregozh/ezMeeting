var express = require('express');
var router = express.Router();
var needle = require('needle');
var User = require('../models/user');
var Meeting = require('../models/meeting');
var moment = require('moment');
var mongoose = require('mongoose');
var Notification = require('../models/notification');
var utils = require('../utils');
var configAuth = require('../config/auth');


// Handler for POST requests to /meetings
router.post('/', ensureAuthenticated, function(req, res, next) {
  //@DEBUG console.log('ip2>>>>', req.connection.remoteAddress); this is to see where does the request coming from
  inviteToMeeting(req, res);
});

// Handler for DELETE requests to /meetings/:id
router.delete('/:id', ensureAuthenticated, function(req, res) {
  var meetingId = req.params.id;
  var meetingGId;
  Meeting.update({ _id: meetingId}, { isDeleted: true }, {upsert: true}, function(err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log('Meeting is set to be deleted'); 
    meetingGId = result.googleId;
  }
});
  var retries = 2;
  var makeRequest = function() {
    console.log('retries is now ' + retries);
    retries--;
    if(!retries) {
      // Couldn't refresh the access token.
      console.log('thres no more retries left');
      return send401Response();
    }
  var email = req.session.user.email;
  var url = 'https://www.googleapis.com/calendar/v3/calendars/' + email + '/events/'+ meetingGId;
  console.log(url);
  options = { headers: { Authorization: 'Bearer '+ user.google.accessToken }};
  needle.delete(url, null, options, function(error, response) {
              if (!error && response.statusCode == 204) {

                console.log('Success! event has been deleted!');               
              } else if (response.statusCode === 401) {
                // Access token expired.
                // Try to fetch a new one.
                refreshAccessToken(organizer,makeRequest);
              } else {
                // There was another error, handle it appropriately.
                console.log('some other error happened');
                res.sendStatus(response.statusCode);
              }   
            }); //needle.post ends here
          }; //makeRequest ends here
        makeRequest();

}); //end router.delete



// Handler for GET requests to /meetings/:id
router.get('/data/:id', ensureAuthenticated, function(req, res, next) {
   var meetingJson = {};
   
   var id = req.params.id;
   Meeting.findOne({ _id: id })
   .populate('organizer')
   .populate('participants')
   .exec(function(err, meeting) {
    if(err || !meeting) { 
      console.log('*****************');
      console.log('problems with finding meeting in db; errors! Heres the error:');
      console.log(err);
      utils.sendErrResponse(res, 404, err);
    } else {
      //start constructing json for response
      console.log('heres the meeting from db');
      console.log(meeting);
      console.log('heres the organizer from meeting');
      // console.log(meeting.organizer);

      console.log('>>> org id = ' + meeting.organizer._id);
      meetingJson = {
        "id": meeting._id,
        "name": meeting.name,
        "startTime": meeting.startTime,
        "endTime": meeting.endTime,
        "description": meeting.description,
        "location": meeting.location,
        "organizer": {
          id: meeting.organizer._id,
          name: meeting.organizer.displayName,
          pic: meeting.organizer.pic
        },
        "participants": [
        ]
      };
      
      var participantObjects = meeting.participants;
      var participantsList = [];
      for ( var i = 0; i < participantObjects.length; i++) {
        var pObject = participantObjects[i];

        participantsList.push({
          "id": pObject._id,
          "name": pObject.displayName,
          "pic": pObject.pic
        });
      }
      meetingJson.participants = participantsList;
      res.send(meetingJson);
    } //end else
  }); // end find from db
});

router.get('/:id', ensureAuthenticated, function(req, res, next) {
  res.render('newmeeting', {user: req.user,'title':'Schedule a meeting', 'meetingId' : req.params.id});
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
          console.log('user access Token before calling createMeeting: ' + organizer.google.accessToken);
          console.log('user refresh Token before calling createMeeting: ' + organizer.google.refreshToken);
          needle.post(url, event, options, function(error, response) {
              if (!error && response.statusCode == 200) {

                console.log('Success! event has created!');
                console.log('this google id needs to be saved:');
                console.log(response.body.id);
                console.log("*******************");
                console.log(response.body);
                console.log("*******************");
                console.log('Returning from inviteToMeeting()');
                console.log('Calling createMeeting()');
                createMeeting(participantIDs, organizerId, response.body, res);                
              } else if (response.statusCode == 401) {
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

function createMeeting(participantIDs, organizerId, res, sendResponse) {
  /*createMeeting:
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
  newMeeting.organizer = new mongoose.Types.ObjectId(organizerId);
  newMeeting.organizerId = organizerId;
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
    	var meetingId = res._id;
    	console.log(newMeeting);
        console.log('Saved newmeeting to db successfully'); 
        console.log('Calling addNewMeetingToUsers'); 
        addNewMeetingToUsers(participantObjectIds, meetingId);

        // Add notifications to database
        console.log('Started createNotification');
        for(var k=0; k< participantIDs.length; k++) {
          if(participantIDs[k] === organizerId) {
            continue;
          } else {
          	console.log('creating Invite to meeting for participants');
            createNotification("inviteToMeeting", meetingId, organizerId, participantIDs[k]);
          }
        }
        console.log('creating Schedule Meeting for organizer');
        createNotification("scheduledYourMeeting", meetingId, organizerId, organizerId);
        console.log('finished creating notifications');
        console.log('sending ID as response for meeting ID: ' + meetingId);
        sendResponse.send(meetingId);
    }
  });
}

function addNewMeetingToUsers(participantObjectIds, meetingId) {
  console.log('inside adding meeting to users');
  console.log(participantObjectIds);
  console.log(meetingId);
  User.update({ _id: { $in: participantObjectIds }}, { $push: { meetings: meetingId }}, {multi: true}, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      console.log('Added newmeeting users successfully'); 
      return;
    }
  });
}

function createNotification(typeString, meetingId, organizerId, recipientId) {
  var newNotification = new Notification();
  // set all of the relevant information
  newNotification.type = typeString;
  newNotification.meeting = new mongoose.Types.ObjectId(meetingId);
  newNotification.organizer = new mongoose.Types.ObjectId(organizerId);
  newNotification.recipient = new mongoose.Types.ObjectId(recipientId);
  newNotification.timeStamp = moment.utc();

  newNotification.save(function(err, res) {
    if (err) {
        console.log(err);  // handle errors!
        throw err;
    } else { 
        console.log('Saved newNotification to db successfully'); 
        return;
    }
  });
}



function refreshAccessToken(user, functiontoRepeat) {

  var url = 'https://www.googleapis.com/oauth2/v4/token?client_id=' + configAuth.googleAuth.clientID +
            '&client_secret=' + configAuth.googleAuth.clientSecret +
            '&refresh_token' + user.google.refreshToken +
            'grant_type=refresh_token';

  console.log(url);

  console.log('user access Token before calling refreshAccessToken: ' + user.google.accessToken);
  console.log('user refresh Token before calling refreshAccessToken: ' + user.google.refreshToken);
  needle.post(url, {}, function(error, accessToken) {
     if (err || !accessToken) {
      console.log('error! couldnt refresh the token!'); //couldn't refresh the token
      return res.status(401).end(); 
    } else {
      // Save the new accessToken for future use
      user.save( { google: { accessToken: response.body.access_token} }, function(err) {
        if (err) {
          console.log('problems with saving new accessToken to db!');
          console.log(err);  // problems with saving into db; errors!
          throw err;
        } else {   
          // Retry the request.
          console.log('calling makeRequest again');
          console.log('now access token is ' + user.google.accessToken);
          functiontoRepeat();
        }
      });
    }
  }); //needle post ends here
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
