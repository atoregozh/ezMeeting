// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// define the schema for our user model
var notificationSchema = new Schema({
  type: {
    type: String, //cancelMeeting, inviteToMeeting, rescheduleMeeting, scheduledYourMeeting
    required: true
  },
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  organizer: {//organizer or a participant
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timeStamp: {
    type: Date,
    requred: true // created_at
  }, 
  recipient: { 
    type: mongoose.Schema.Types.ObjectId  //logged in user, notification is meant to show for this user
  }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Notification', notificationSchema);