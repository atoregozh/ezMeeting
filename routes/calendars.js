// PACKAGES //
router = require('express').Router();
var utils = require('../utils');
var User = require('../models/user');
var needle = require('needle');
async = require("async");
var configAuth = require('../config/auth');


// Handler for GET requests to /calendars/?users=id1,id2&from=ISOString1to=ISOString2
router.get('/', function(req, res) {
	var fromTime = req.query.from;
	var toTime = req.query.to;
	var users = req.query.users;
	var usersList = users.split(',');


	User.find({ _id: { $in: usersList } }, function(err, users) {
		if (err) {
			console.log(err);
      utils.sendErrResponse(res, 503, err);
    } else {
    	var listOfFunctions = [];

    	listOfFunctions = users.map(function(user){
    		return function(callback){
    			getDataFromGoogle(callback, {user: user, fromTime: fromTime, toTime: toTime});
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
});		

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
  console.log('returning from filterUserCalData');
  return userMap;
}

function getDataFromGoogle (callback, params) {
		var user = params.user;
  	var url = 'https://www.googleapis.com/calendar/v3/calendars/' + user.email + '/events'+
            '?orderBy=startTime&singleEvents=true&timeMax='+ params.toTime +'&timeMin='+ params.fromTime;
	  console.log(url);
	  console.log('user access Token for ' + user.displayName + ' is: ' + user.google.accessToken);
	  console.log('user refresh Token for ' + user.displayName + ' is: ' + user.google.refreshToken);
	  needle.get(url, 
	            { headers: { Authorization: 'Bearer '+ user.google.accessToken } },  
					    function(error, googleResponse) {
					      if (!error && googleResponse.statusCode == 200) {

					        console.log('Success! calling filterUserCalData()');
					        var jsonUserMap = filterUserCalData(user,googleResponse.body);
					        console.log('returning from filterUserCalData');
					        callback(null, jsonUserMap);
					      } else if (googleResponse.statusCode == 401) {
						      // Access token expired.
						      // Try to fetch a new one.
						      refreshAccessToken(callback, params);
					      } 
					      else {
					        callback({error: "Bad request for " + user._id}, null);
					      }       
		}); //end needle get
}

function refreshAccessToken(callback, params) {
  console.log("calling refreshaccessToken()");
	var user = params.user;
	var url = 'https://www.googleapis.com/oauth2/v4/token?client_id=' + configAuth.googleAuth.clientID +
            '&client_secret=' + configAuth.googleAuth.clientSecret +
            '&refresh_token=' + user.google.refreshToken +
            '&grant_type=refresh_token';

  console.log(url);

  console.log('user access Token before calling refreshAccessToken: ' + user.google.accessToken);
  console.log('user refresh Token before calling refreshAccessToken: ' + user.google.refreshToken);
  
  var data = {};
  var options = {json: true };

  needle.post(url, data, options, function(error, response) {
     if (error || !response) {
      console.log('error! couldnt refresh the token!'); //couldn't refresh the token
      callback({error: "Couldn't refresh the access token for " + user._id} , null);

    } else {
      var newAccessToken = response.body.access_token;
      console.log("New Access Token for " + user.displayName + ' is ' + newAccessToken);
      console.log("Saving to to database"); 
      // Save the new accessToken for future use
      User.update({_id: user._id}, { $set: { 'google.accessToken': newAccessToken } }, {new: true}, function(err) {
        if (err) {
          console.log('problems with saving new accessToken to db!');
          console.log(err);  // problems with saving into db; errors!
          callback({error: "Couldn't save the new access token for " + user._id} , null);  
        } else {   
          // Retry the request.
          console.log('calling makeRequest again');
          console.log('now access token for ' + user.displayName + ' is ' + user.google.accessToken);
          getDatafromGoogleAgain(callback, params, newAccessToken);
        }
      }); //user.update ends here
    }
  }); //needle post ends here
}

function getDatafromGoogleAgain(callback, params, newAccessToken ) {
  var user = params.user;
  var url = 'https://www.googleapis.com/calendar/v3/calendars/' + user.email + '/events'+
            '?orderBy=startTime&singleEvents=true&timeMax='+ params.toTime +'&timeMin='+ params.fromTime;
  console.log(url);
  console.log('user access Token for ' + user.displayName + ' is: ' + newAccessToken);
  console.log('user refresh Token for ' + user.displayName + ' is: ' + user.google.refreshToken);
  needle.get(url, 
            { headers: { Authorization: 'Bearer '+ newAccessToken } },  
            function(error, googleResponseNew) {
              if (!error && googleResponseNew.statusCode == 200) {

                console.log('Success! calling filterUserCalData()');
                var jsonUserMap = filterUserCalData(user,googleResponseNew.body);
                console.log('returning from filterUserCalData');
                callback(null, jsonUserMap);
              } 
              else {
                callback({error: "Bad request for " + user._id}, null);
              }       
  }); //end needle get
}

module.exports = router;