var express = require('express');
var router = express.Router();
var needle = require('needle');

// Handler for POST requests to /events
router.post('/', function(req, res, next) {
	res.send('Received POST request for /events');
  // save the card to db req.data get data from ajax
});

router.get('/', function(req, res, next) {
  res.render('events', {'title':'My event title'})
});

router.get('/all', function(req, res) {
  console.log('')
  console.log(req.session.access_token)
  needle.get('https://www.googleapis.com/calendar/v3/calendars/toregozh%40gmail.com/events', 
    {headers: {Authorization: 'Bearer '+ req.session.access_token}},  function(error, response) {
    if (!error && response.statusCode == 200)
      console.log(response.body);
    res.send(response.body);
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
