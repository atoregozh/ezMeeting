var express = require('express');
var router = express.Router();

// Handler for POST requests to /events
router.post('/', function(req, res, next) {
	res.send('Received POST request for /events');
});

// GET events listing
router.get('/', function(req, res, next) {
 	res.send('Received GET request for /events');
});

// Handler for GET requests to /events/:id
router.get('/:id', function(req, res, next) {
	var id = req.params.id;
	res.render('events', {'title':'My event title', 'id': id})
});

module.exports = router;
