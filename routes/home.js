var express = require('express');
var router = express.Router();

// Handler for POST requests to /home
router.post('/', function(req, res, next) {
	res.send('Received POST request for /home');
});

// Handler for GET requests to /home
router.get('/', function(req, res, next) {
 	res.send('Received GET request for /home');
});

/* GET homepage */
router.get('/:username', function(req, res, next) {
	notifications = [{'text': 'first notification'}, {'text': 'second notification'}]
 	res.render('home', {'username': req.params.username, 'notifications': notifications})
});

module.exports = router;
