var express = require('express');
var router = express.Router();

// =====================================
// ROOT PAGE (with google login) ========
// =====================================
var authenticatePassport = function(passport) {
  router.get('/', function(req, res) {
      // Rendering the index view with the title 'Welcome'
      res.render('index', { title: 'Welcome'});
  });


  // =====================================
  // LOGOUT ==============================
  // =====================================
  router.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });

  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email', 
                                                              'https://www.googleapis.com/auth/calendar'],
                                                              accessType: 'offline'  }
              ));

  // the callback after google has authenticated the user
  router.get('/auth/google/callback',
          passport.authenticate('google', { failureRedirect : '/test' }),
          function(req, res) {
            // Successful authentication, redirect home.
            req.session.access_token = req.user.google.accessToken;
            console.log("PRINTING SESSION ACCESS TOKEN");
            console.log(req.session.access_token);
            res.redirect('/home');                
          });

  return router;
};

// route middleware to make sure a user is logged in
function ensureAuthenticated(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


module.exports = authenticatePassport;