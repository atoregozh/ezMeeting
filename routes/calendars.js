// PACKAGES //
router = require('express').Router();
var utils = require('../utils');
var User = require('../models/user');
var needle = require('needle');
async = require("async");


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
    	var respArr = [];
    	var listOfFunctions = [];

    	listOfFunctions = users.map(function(user){
    		return function(callback){
    			getGCalendarEventsPerUser2(callback, user,fromTime, toTime, res);	
    		};
    	});

    	async.parallel(listOfFunctions, function(err, results){
    		if(err){
    			utils.sendErrResponse(res, 503, err);
    		}else {
    			res.send(results);
    		}
    	});

      /**** Async example *****

      var allResults = [];
    	console.log('--------');
    	var optionalCallback = function(err, results){
    		console.log(results);
    		console.log("Tada!");
    		console.log(allResults);
    	};

    	var listOfFunctions = [];
    	for(var i = 0; i < 5; i++){
    		listOfFunctions.push(function(innerCallback){
    			// getGCalendarEventsPerUser(usersList[i],fromTime, toTime, res);
    			setTimeout(function(){
    				allResults.push('result');
    				innerCallback(null, 'func-' + i);    				
    			}, 200);
    		});
    	}
    	console.log('1');
    	async.parallel(listOfFunctions, optionalCallback);
    	console.log('2');
			*/
    }
	});
});

function getGCalendarEventsPerUser2(callback, user, fromTime, toTime, res) {
	var retries = 2;
  console.log('starting out getGCalendarEventsPerUser2');

  var makeRequest = function(callback) {
    retries--;
    if(!retries) {
      // Couldn't refresh the access token.
      callback({error: "Couldn't refresh the access token for " + userId} , null);
    }
  var url = 'https://www.googleapis.com/calendar/v3/calendars/' + user.email + '/events'+
            '?orderBy=startTime&singleEvents=true&timeMax='+ toTime +'&timeMin='+fromTime;
  console.log(url);
  console.log('user access Token is: ' + user.google.accessToken);
  console.log('user refresh Token is: ' + user.google.refreshToken);
  needle.get(url, 
            { headers: { Authorization: 'Bearer '+ user.google.accessToken } },  
    function(error, googleResponse) {
      if (!error && googleResponse.statusCode == 200) {

        console.log('Success! calling filterUserCalData()');
        var jsonUserMap = filterUserCalData(user,googleResponse.body);
        console.log('returning from filterUserCalData');
        callback(null, jsonUserMap);
      } else if (googleResponse.statusCode === 401) {
      // Access token expired.
      // Try to fetch a new one.
        refreshAccessToken(user,makeRequest);
      } else {
        callback({error: "Bad request for " + userId}, null);
      }       
    }); //end needle get
  };

  makeRequest(callback);
	return;
}    			


function getGCalendarEventsPerUser(user,fromTime, toTime, res) {
  var retries = 2;
  console.log('starting out getGCalendarEventsPerUser');

  var makeRequest = function() {
    retries--;
    if(!retries) {
      // Couldn't refresh the access token.
      utils.sendErrResponse(res, 401, "Couldn't refresh the access token");
    }
  var url = 'https://www.googleapis.com/calendar/v3/calendars/' + user.email + '/events'+
            '?orderBy=startTime&singleEvents=true&timeMax='+ toTime +'&timeMin='+fromTime;
  console.log(url);
  console.log('user access Token is: ' + user.google.accessToken);
  console.log('user refresh Token is: ' + user.google.refreshToken);
  needle.get(url, 
            { headers: { Authorization: 'Bearer '+ user.google.accessToken } },  
    function(error, googleResponse) {
      if (!error && googleResponse.statusCode == 200) {

        console.log('Success! calling filterUserCalData()');
        var jsonUserMap = filterUserCalData(user,googleResponse.body);
        console.log('returning from filterUserCalData');
        return jsonUserMap;
      } else if (googleResponse.statusCode === 401) {
      // Access token expired.
      // Try to fetch a new one.
        refreshAccessToken(user,makeRequest);
      } else {
        // There was another error, handle it appropriately.
        console.log('some other error happened');
        console.log(googleResponse.body);
        utils.sendErrResponse(res, 500, 'Bad Request');
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
  console.log('returning from filterUserCalData');
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