// PACKAGES //
router = require('express').Router();
var Meeting = require('../models/meeting');
var algoliasearch = require('algoliasearch');
var client = algoliasearch("SE79GLOIEP", "9bc3123e557c4da31d1388f9a26da8b4");
//index = client.initIndex('ezmeeting_users_test');
index = client.initIndex('ezmeeting_users_test');

  // =====================================
  // DASHBOARD ===========================
  // route for showing the dashboard page
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the ensureAuthenticated function)
  router.get('/', ensureAuthenticated, function(req, res) {
  	// Save user details to Algolia for autocomplete
  	var user = req.user;
	index.saveObject({
		googleId: user.google.id,
		displayName: user.displayName,
		email: user.email,
		pic: user.pic,
		objectID: user._id
	}, function(err, content) {
		if (err) {
			console.log("Error occured while trying to index: " + user._id);
			console.log(err);
			return;
		}
		console.log("Successfully indexed: " + user._id);
		console.log(content);
	});

    Meeting.find( { $and:[ { isDeleted: false }, {organizerId: req.session.user._id } ] } )
    .populate('participants')
    .sort({startTime: -1}).limit(18).exec(function(err, userMeetings) {
      if (err) {
        console.log(err);  // handle errors!
        res.status(503).end();   // problems with finding notification docs in db; errors!
      } else {
        var listOfUserMeetings = userMeetings.map(function(userMeeting){
          var participantsList = userMeeting.participants;
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
            organizerPic : req.session.user.pic,
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

// route middleware to make sure a user is logged in
function ensureAuthenticated(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = router;
