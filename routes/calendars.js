var express = require('express');
var router = express.Router();
var moment = require('moment');

router.get('/', function(req, res, next) {
	var from = new Date(req.query.from);
	var to = new Date(req.query.to);
	var users = req.query.users;
	var usersList = users.split(',');
	console.log('moment =' + moment().format());

	var data = [];

	var count = 0;
	for(var i = 0; i < usersList.length; i++) {
		var userId = usersList[i];
		var userEvents = [];
		// Get user events within the time range:
		var start = moment(from).add(count++, 'h');

		var currentStart = start;
		for(var b = 0; b < 1; b++) {
			userEvents.push({
				id: userId + '-' + b,
				ownerId: userId,
				name: 'Test event',
				startTime: currentStart.format(),
				endTime: currentStart.add(30, 'minutes'),
				isInternal: true
				});
			currentStart.add(30, 'minutes');
		}
		data.push({
			userId: userId,
			events: userEvents
		})
	}
	var result = {data: data};
	res.send(result);
	
// {
// 3 data: { 4[ 5{
// 6         userId: 1, // The user whose calendar this event is on
// 7         events: [ // For recurring events, there'll be one item per occurrence.
// 8{ 9
// ￼￼￼￼￼id: 'string',
// ownerId: 1 // Same as userId if this event was created by this user.
// name: 'string',
// startTime: 'string', // UTC DateTime
// endTime: 'string', // UTC DateTime
// isInternal: false, // False means it came from Google calendar or another exter
// ￼￼￼￼￼￼￼￼￼￼￼￼nal source
//           }, //...
// 15
// 16
// 17         ]
// 18       }, //...
// 19     ]
// 20   }
// 21 }




	
	// var result = {
	// 	from : from.toISOString(),
	// 	to: to.toISOString(),
	// 	users: users
	// }
	// res.send(JSON.stringify(result));
});

module.exports = router;



// // GET events listing
// router.get('/', function(req, res, next) {
//  	res.send('Received GET request for /events');
// });

// // Handler for GET requests to /events/:id
// router.get('/:id', function(req, res, next) {
// 	var id = req.params.id;
// 	res.render('events', {'title':'My event title', 'id': id})
// });