// load the things we need
//********AVAILABILITY MODEL***********
//*************************************

/* One record would be created for every event read from each user's 
google calendar and for every edited availability */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// define the schema for our user model
var userEventSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  googleId: {
    type: String,
    ref: 'Meeting'
  },
  name: {
    type: String 
  },
  isActive: { //false implies that the user has removed this from their 'availability'. This is important to ensure we can exclude events from external calendar. If it's an internal event, simply delete it.
    type: Boolean
  },
  startTime: {
    type: String,
    requred: true // ISO String
  },
  endTime: {
    type: String,
    requred: true // ISO String
  },
  isInternal: { // 'false' means it came from Google calendar or another external source. True means the user added an empty slot on their profile.
    type: Boolean
  }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('UserEvent', userEventSchema);