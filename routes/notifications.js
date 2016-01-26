// PACKAGES //
router = require('express').Router();
var Notification = require('../models/notification');
moment = require('moment');

// Handler for GET requests to /notifications/after='timestamp'
router.get('/', ensureAuthenticated, function(req, res) {
	var time = moment('1900-01-01').toDate(); // A randomly chosen date in the past that's earlier than all our timestamps.
	if (req.query.after) {
		time = moment(req.query.after).toDate();
	}
	console.log('>>> Time = ' + time);
	Notification.find({ $and:[ { timeStamp: { $gte: time } }, {user: req.session.user._id} ]})
	.populate('meeting').populate('user')
	.sort({timeStamp: -1}).limit(20).exec(function(err, notifications) {
	  if (err) {
	    console.log(err);  // handle errors!
	    res.status(503).end();   // problems with finding notification docs in db; errors!
	  } else {

	    var listOfNotifications = notifications.map(function(notification){
	      return {
	        type: notification.type,
	        userDisplayName: notification.user.displayName,
	        meetingName: notification.meeting.name,
	        meetingId: notification.meeting._id,
	        startTime: notification.meeting.startTime,
	        timeStamp: notification.timeStamp
	      };
	    });
	    console.log('>>> pretty notification');
	    console.log(listOfNotifications.length);
	    console.log(listOfNotifications);
	    res.send(listOfNotifications);
	  } // End of else
	});
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