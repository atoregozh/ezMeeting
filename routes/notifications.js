// PACKAGES //
router = require('express').Router();
var Notification = require('../models/notification');
async = require("async");

// Handler for GET requests to /notifications/?user=id&after='timestamp'
router.get('/', function(req, res) {
  if (!req.query.after) {
    now = Date.now();
    //returns most recent 20 notifications if no timestamp is specified
    Notification.find({ $and:[ { timeStamp: { $lte: now } }, {userId: req.query.user} ]}).
    sort({timeStamp: -1}).limit(20).exec(function(err, notifications) {
      if (err) {
        console.log(err);  // handle errors!
        res.status(503).end();   // problems with finding notification docs in db; errors!
      } else {
        var listOfFunctions = [];

        listOfFunctions = notifications.map(function(notification){
          return {
            type: notification.type,
            userDisplayName: notification.userId.displayName,
            meetingName: notification.meetingId.name,
            meetingId: notification.meetingId._id,
            startTime: notification.meetingId.startTime
          };
        });

        async.parallel(listOfFunctions, function(err, results){
          if(err){
            utils.sendErrResponse(res, 503, err);
          }else {
            res.send(results);
          }
        });
      }
    });
  } else {
    //returns all notifications after timestamp
    Notification.find({ $and:[ { timeStamp: { $lte: req.query.after } }, {userId: req.query.user} ]}).
    sort({timeStamp: -1}).exec(function(err, notifications) {
      if (err) {
        console.log(err);  // handle errors!
        res.status(503).end();   // problems with finding notification docs in db; errors!
      } else {
        var listOfFunctions = [];

        listOfFunctions = notifications.map(function(notification){
          return {
            type: notification.type,
            userDisplayName: notification.userId.displayName,
            meetingName: notification.meetingId.name,
            meetingId: notification.meetingId._id,
            startTime: notification.meetingId.startTime
          };
        });

        async.parallel(listOfFunctions, function(err, results){
          if(err){
            utils.sendErrResponse(res, 503, err);
          }else {
            res.send(results);
          }
        });
      }
    });
  } //end else
});

module.exports = router;