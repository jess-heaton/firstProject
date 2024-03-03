const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: false // Optional field
  },
  age: {
    type: Number,
    required: false // Optional field
  },
  gender: {
    type: String,
    required: false // Optional field
  },
  course: {
    type: String,
    required: false // Optional field
  }
  // Add any other fields you find necessary
});

module.exports = mongoose.model('User', UserSchema);
