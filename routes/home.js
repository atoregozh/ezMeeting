// PACKAGES //
router = require('express').Router();
var Meeting = require('../models/meeting');
var configAuth = require('../config/auth');
var request = require('request');

var eSearchConfig = configAuth.elasticSearchAuth;
var eSearchUrl = eSearchConfig.host + ":" + eSearchConfig.port + "/" + eSearchConfig.index + "/" + eSearchConfig.type;

// =====================================
// DASHBOARD ===========================
// route for showing the dashboard page
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the ensureAuthenticated function)
router.get('/', ensureAuthenticated, function(req, res) {
	// Save user details to ElasticSearch for autocomplete
	var user = req.user;
  var options = {
    url: eSearchUrl + "/" + user.email, // Specifying the user's email as the record ID
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
      "authorization" : eSearchConfig.authorization
    },
    json: {
      googleId: user.google.id,
      displayName: user.displayName,
      email: user.email,
      pic: user.pic,
      objectID: user._id
    }
  };
  
  request(options, function (error, response, body) {
    if (error || response.statusCode == 200) {
      console.log("Error occured while trying to index: " + user._id);
      console.log(error);
      return;
    }else{
      console.log("Successfully indexed: " + user._id);
      console.log(body);  
    }
  });

  Meeting.find( { 
    $and:[ 
      { isDeleted: false }, 
      { $or: [ {organizerId: req.session.user._id}, {participants:req.session.user._id} ] } 
      ] } )
  .populate('participants')
  .populate('organizer')
  .sort({startTime: -1}).limit(18).exec(function(err, userMeetings) {
    if (err) {
      console.log(err);  // handle errors!
      res.status(503).end();   // problems with finding notification docs in db; errors!
    } else {
      var listOfUserMeetings = userMeetings.map(function(userMeeting){
        var participantsList = userMeeting.participants;
        var orgTest = userMeeting.organizer;
        console.log("This infor is about the organizer " + orgTest);
        var extraParticipants = 0;
        if(participantsList.length > 7){
          extraParticipants = participantsList.length - 7;
          participantsList = participantsList.slice(0, 7);
        }
        return {
          name : userMeeting.name,
          id : userMeeting._id,
          location : userMeeting.location,
          description: userMeeting.description,
          startTime : userMeeting.startTime,
          endTime : userMeeting.endTime,
          extraParticipants: extraParticipants,
          organizerPic : userMeeting.organizer.pic,
          participantsList : participantsList
        };
      });
      console.log('>>> user meetings');
      console.log(listOfUserMeetings.length);
      console.log(listOfUserMeetings.length - 7);
      console.log(listOfUserMeetings);
      console.log('Authenticated the user! Here are the details of user:');
      console.log(req.user); 
      if(!listOfUserMeetings) {
        listOfUserMeetings = [];
        extraParticipants = 0;
      }
      res.render('home', {
            user : req.user, // get the user out of session and pass to template
            meetings: listOfUserMeetings
      });
    } // End of else
  }); //end of exec

}); //end of router.get


//@TODO: remove after testing 404 page
router.get('/test404', ensureAuthenticated, function(req, res, next) {
  res.render('404', {
              user: req.user,
              'title':'Page Not Found', 
            });
});

// route middleware to make sure a user is logged in
function ensureAuthenticated(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = router;
