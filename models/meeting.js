// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//********MEETING MODEL****************
//*************************************

// define the schema for our user model
var meetingSchema = new Schema({
  
  googleId: {
    type: String, 
    required: true, 
    unique: true
  },
  name: {
    type: String
  },
  isActive: { //false implies that the user has removed this from their 'availability'
    type: Boolean
  }, 
  isDeleted: {
    type: Boolean // false if the meetings gets cancelled
  },
  startTime: {
    type: Date,
    requred: true // ISO String
  },
  endTime: {
    type: Date,
    requred: true // ISO String
  },
  description: {
    type: String
  },
  location: {
    type: String
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organizerId: {
    type: String
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId, //userId list
    ref: 'User'
  }],
  isInternal: {
    type: Boolean
  }
  
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Meeting', meetingSchema);