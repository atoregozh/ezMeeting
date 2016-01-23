var express = require('express');
var router = express.Router();
var moment = require('moment');

router.get('/', function(req, res, next) {
	var from = new Date(req.query.from);
	var to = new Date(req.query.to);
	var users = req.query.users;
	var usersList = users.split(',');
	// console.log('req.query.from = ' + req.query.from);
	// console.log('req.query.to = ' + req.query.to);
	console.log('users = ' + users);
	console.log('from = ' + from);
	console.log('to = ' + to);

	var data = [];

	var hourShift;
	var minutesBeforeNextMeeting;
	var meetingDuration;
	for(var i = 0; i < usersList.length; i++) {
		var userId = usersList[i];
		var userEvents = [];
		// Get user events within the time range:
		hourShift = hourShift = Math.floor((Math.random() * 48) + 1); // Random number between 1 and 48

		var currentStart = moment(from).add(hourShift, 'h');
		minutesBeforeNextMeeting = Math.floor((Math.random() * 300) + 1); // Random number between 1 and 300
		meetingDuration = Math.floor((Math.random() * 90) + 1); // Random number between 1 and 90
		for(var b = 0; b < 20; b++) {
			var startTime = currentStart;
			var endTime = currentStart.add(meetingDuration, 'minutes').format();

			// Error check in case I mistakenly configure crap in the randomization logic.
			if (startTime < from || endTime > to){
				continue;
			}
			userEvents.push({
				id: userId + '-' + b,
				ownerId: userId,
				name: 'Test event',
				startTime: currentStart.format(),
				endTime: currentStart.add(meetingDuration, 'minutes').format(),
				isInternal: true
				});
			currentStart.add(minutesBeforeNextMeeting, 'minutes');
		}
		data.push({
			userId: userId,
			events: userEvents
		});
	}
	console.log(JSON.stringify(data, null, 4));
	res.send(data);
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