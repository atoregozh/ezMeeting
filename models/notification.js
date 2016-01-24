// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// define the schema for our user model
var notificationSchema = new Schema({
  type: {
    type: String, //cancelMeeting, inviteToMeeting, rescheduleMeeting, scheduledYourMeeting
    required: true
  },
  meetingName: {
    type: String,
    ref: 'Meeting'
  },
  meetingUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timeStamp: {
    type: Date,
    requred: true // created_at
  }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Notification', notificationSchema);