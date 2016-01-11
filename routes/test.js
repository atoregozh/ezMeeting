var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
	notifications = [{'text': 'first notification'}, {'text': 'second notification'}]
	res.render('test', {'key':'value', 'notifications':notifications})
});

module.exports = router;
