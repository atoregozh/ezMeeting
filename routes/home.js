var express = require('express');
var router = express.Router();

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
          },
          {
            'id': 'asfsdafdsfa',
            'name': 'Michael Jordan',
            'pic': '/img/default-user-pic.jpg'
          }
          ]}]

//var db = []

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


    // User.findById(req.session.passport.user, function(err, user) {
      console.log('Authenticated the user! Here are the details of user:');
      console.log(req.user); //@TODO implement algolia indexing here @Kesiena
      res.render('home', {
            user : req.user, // get the user out of session and pass to template
            meetings: db
            }
      // if(err) {
      //   console.log(err);  // handle errors
      // } else {
      //   res.render('home', { user: user});
      // }
    );
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
