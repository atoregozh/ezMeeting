// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var userSchema = mongoose.Schema({
  
  google: {
    accessToken: {
      type: String, 
      required: true, 
      unique: true, 
      trim: true
    },
    refreshToken: {
      type: String, 
      required: true, 
      unique: true, 
      trim: true
    },
    id: {
      type: String, 
      required: true, 
      unique: true
    }
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true
  },
  displayName: {
    type: String
  },
  name: {
      firstname: {
        type: String, 
        required: true, 
        trim: true
      },
      lastname: {
        type: String, 
        required: true, 
        trim: true
      },
  },
  pic: { //link to user's profile picture
   type: String
  } 
  //meetings: [meetingId, meetingId, ...] INCOMPLETE!
  //meetings: [Schema.Types.ObjectId]
  });

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);