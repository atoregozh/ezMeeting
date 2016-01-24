var express = require('express');
var router = express.Router();

// Handler for GET requests
router.get('/', ensureAuthenticated, function(req, res, next) {
 res.render('profile', {'title':'My event title'});
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