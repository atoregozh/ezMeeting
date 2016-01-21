var express = require('express');
var router = express.Router();
var gcal = require('google-calendar');

// Handler for POST requests to /events
router.post('/', function(req, res, next) {
	res.send('Received POST request for /events');
});

router.get('/', function(req, res, next) {
  res.render('events', {'title':'My event title'})
});

router.get('/all', function(req, res) {
  if(!req.session.access_token) {
    return res.redirect('/auth/google'); //should do back to index.js and authenticate
  } 
  var accessToken = req.session.access_token;
  //instantiate google calendar instance
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  
  google_calendar.events.list(req.user.email, {'timeMin': new Date().toISOString()}, 
    function(err, eventList){
      if(err){
        res.status(500).send(err);
      }
      else{
        res.writeHead(200, {"Content-Type": "application/json"});
        res.send(eventList);
      }
    });

});



// // GET events listing
// router.get('/', function(req, res, next) {
//  	res.send('Received GET request for /events');
// });

// // Handler for GET requests to /events/:id
// router.get('/:id', function(req, res, next) {
// 	var id = req.params.id;
// 	res.render('events', {'title':'My event title', 'id': id})
// });

module.exports = router;
