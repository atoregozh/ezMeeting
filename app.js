// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session  = require('express-session');

var configDB = require('./config/database.js');

// templating engine setup ======================================================================
app.set('views', path.join(__dirname, 'views'));
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({extname:'.hbs'}));
app.set('view engine', '.hbs'); // set up handlbars for templating

// set up our express application
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev')); // log every request to the console
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(express.static(path.join(__dirname, 'public')));

// configuration ===============================================================
require('./config/passport')(passport); // pass passport for configuration

mongoose.connect(configDB.url, function (err, res) { // connect to our database
  if (err) {
      console.log ('ERROR connecting to database. ' + err);
  } else {
    console.log ('Succeeded connected to database.');
  }
}); 

// required for passport
app.use(session({ 
  secret: 'ilovescotchscotchyscotchscotch', // session secret
  resave: true,
  saveUninitialized: false 
})); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions


// routes ======================================================================
var routes = require('./routes/index')(passport); // load our index.js and pass in our app and fully configured passport
var home = require('./routes/home');
var meetings = require('./routes/meetings');
var newmeeting = require('./routes/newmeeting');
var profile = require('./routes/profile');
var test = require('./routes/test');
var calendars = require('./routes/calendars');
var mockcalendars = require('./routes/mockcalendars'); // Todo: Delete after implementing calendar.js
var notifications = require('./routes/notifications');

app.use('/', routes);
app.use('/meetings', meetings);
app.use('/newmeeting', newmeeting);
app.use('/home', home);
app.use('/profile', profile);
app.use('/test', test);
app.use('/calendars', calendars);
app.use('/mockcalendars', mockcalendars); // Todo: Delete after implementing calendar.js
app.use('/notifications', notifications);


// error handlers ================================================
// !!!!!!!  HAVE TO BE LAST ONES DEFINED IN app.js     !!!!!!!
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// // development error handler
// // will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
