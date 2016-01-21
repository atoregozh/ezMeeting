var express = require('express');
var router = express.Router();

// var db = 
//         [{'name': 'New Meeting Name',
//   'location': '77 mass av',
//   'date': 'Jan 1, 2016', 'startTime':'10:30', 'endTime':'11:30'}]

var db = []

  // =====================================
  // DASHBOARD ===========================
  // route for showing the dashboard page
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the ensureAuthenticated function)
  router.get('/', ensureAuthenticated, function(req, res) {
    // User.findById(req.session.passport.user, function(err, user) {
      console.log('Authenticated the user! Here are the details of user:');
      console.log(req.user);
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
