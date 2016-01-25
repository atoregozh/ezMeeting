// PACKAGES //
var router = require('express').Router();
var utils = require('../utils');
var User = require('../models/user');


// Handler for GET requests to /calendars/?users=id1,id2&from=ISOString1to=ISOString2
router.get('/', function(req, res) {
	var from = req.query.from;
	var to = req.query.to;
	var users = req.query.users;
	var usersList = users.split(',');

	User.find({ _id: { $in: usersList } }, function(err, users) {
		if (err) {
			console.log(err);
      utils.sendErrResponse(res, 503, err);
    } else {
    	console.log('getting users docs'); 
    	var respArr = [];
			for (var i = 0; i < users.length; i++) {
				var user = users[i]; //participant is User document with all the fields set
				var userMap = getGCalendarEventsPerUser(user,from, to);
				respArr.push(userMap);
      }
      result = {"data": respArr};
      console.log("sending to successfully");
      utils.sendSuccessResponse(res, result);
    }
	});
});

function getGCalendarEventsPerUser(user,from, to) {
  var retries = 2;
  console.log('starting out getGCalendarEventsPerUser');

  var makeRequest = function() {
    retries--;
    if(!retries) {
      // Couldn't refresh the access token.
      utils.sendErrResponse(res, 401, "Couldn't refresh the access token");
    }

  var url = 'https://www.googleapis.com/calendar/v3/calendars/'+user.email+'/events'+
            '?orderBy=startTime&singleEvents=true&timeMax='+to+'&timeMin='+from;
  console.log(url);
  console.log('user access Token is: ' + user.google.accessToken);
  console.log('user refresh Token is: ' + user.google.refreshToken);
  needle.get(url, 
            { headers: { Authorization: 'Bearer '+ user.google.accessToken } },  
    function(error, googleResponse) {
      if (!error && googleResponse.statusCode == 200) {

        console.log('Success! calling filterUserCalData()');
        var jsonUserMap = filterUserCalData(user,response.body);
        return jsonUserMap;
      } else if (googleResponse.statusCode === 401) {
      // Access token expired.
      // Try to fetch a new one.
        refreshAccessToken(user,makeRequest);
      } else {
        // There was another error, handle it appropriately.
        console.log('some other error happened');
        console.log(googleResponse.body);
        utils.sendErrResponse(googleResponse, 500, err);
      }   
    }); //end needle get
  };
  makeRequest();
}

function filterUserCalData(user,data) {
  var filteredJsonArr = [];
  for( var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    if (( item.start.dateTime === null ) || (typeof(item.start.dateTime) == 'undefined') &&
      (typeof(item.end.dateTime) == 'undefined' || item.end.Time === null)) {
      continue;
    } else {

      filteredJsonArr.push({
          id: item.id,
          name: item.summary,
          startTime: item.start.dateTime, 
          endTime: item.end.dateTime,
          isInternal: false, // False means it came from Google calendar or another external source
       });
    }
  }
  console.log('Heres the json array');
  console.log(filteredJsonArr);
  var userMap = {userId: user._id , events: filteredJsonArr};
  return userMap;
}


function refreshAccessToken(user, functiontoRepeat) {
  console.log('refresh token used to be:' + user.google.refreshToken);
  refresh.requestNewAccessToken('google', user.google.refreshToken, 
    function(err, accessToken) {
      if (err || !accessToken) {
        console.log('error! couldnt refresh the token!'); //couldn't refresh the token
        return res.status(401).end(); 
      }

      // Save the new accessToken for future use
      user.save( { google: { accessToken: accessToken} }, function(err) {
        if (err) {
          console.log('problems with saving new accessToken to db!');
          console.log(err);  // problems with saving into db; errors!
          throw err;
        } else {   
          // Retry the request.
          console.log('calling makeRequest again');
          console.log('now refresh token is ' + user.google.refreshToken);
          functiontoRepeat();
        }
      });
    });
}

module.exports = router;