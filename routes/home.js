// PACKAGES //
router = require('express').Router();
var Meeting = require('../models/meeting');
var algoliasearch = require('algoliasearch');
var client = algoliasearch("SE79GLOIEP", "9bc3123e557c4da31d1388f9a26da8b4");
//index = client.initIndex('ezmeeting_users_test');
index = client.initIndex('ezmeeting_users');

var db = 
        [{
          'name': 'New Meeting Name',
          'id': 'asafsaddsa',
          'location': '77 mass av',
          'description': 'The meeting description',
          'startTime': "2016-01-25T02:01:07-05:00", 
          'endTime': "2016-01-25T03:01:50-05:00",
          'extraParticipants': 3,
          'organizer': {
            'id': 'asdfknnljodsf',
            'name': 'John Smith',
            'pic': '/img/default-user-pic.jpg'
          },
          'participants': [
          {
            'pic': '/img/default-user-pic.jpg'
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          }
          ]}]
    
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

    var listOfUserMeetings = [];
    Meeting.find( { $and:[ { isDeleted: false }, {organizerId: req.session.user._id } ] } )
    .populate('participants')
    .sort({startTime: -1}).limit(18).exec(function(err, userMeetings) {
      if (err) {
        console.log(err);  // handle errors!
        res.status(503).end();   // problems with finding notification docs in db; errors!
      } else {
        listOfUserMeetings = userMeetings.map(function(userMeeting){
          return {
            name : userMeeting.name,
            id : userMeeting._id,
            location : userMeeting.location,
            description: userMeeting.description,
            startTime : userMeeting.startTime,
            endTime : userMeeting.endTime,
            organizerPic : req.session.user.pic,
            participants : [{
              pic: participants.pic
            }]
          };
        });
        console.log('>>> user meetings');
        console.log(listOfUserMeetings.length);
        console.log(listOfUserMeetings.length - 7);
        console.log(listOfUserMeetings);
        extraParticipants = listOfUserMeetings.length - 7;
        listOfUserMeetings.push({"extraParticipants": extraParticipants});
      } // End of else
    }); //end of exec

      console.log('Authenticated the user! Here are the details of user:');
      console.log(req.user); 
      res.render('home', {
            user : req.user, // get the user out of session and pass to template
            meetings: listOfUserMeetings
            }

    );
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
