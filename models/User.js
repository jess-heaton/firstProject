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
  // Adding personal details fields from the listing form
  firstName: {
    type: String,
    required: false // Assuming this is mandatory
  },
  lastName: {
    type: String,
    required: false // Assuming this is mandatory
  },
  birthdate: {
    type: Date,
    required: false // Assuming this is mandatory
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary'], // Ensures the gender is one of these values
    required: false
  },
  tags: [{
    type: String, // Could be an array of strings to capture multiple interests
  }],
  lookingFor: {
    type: String,
    required: false // Set to true if mandatory
  },
  moveInTimeframe: {
    type: String,
    required: false
  },
  customMoveInDate: {
    type: Date,
    required: false
  },
  monthlyBudget: {
    type: Number,
    required: false
  },
  budgetIncludesBills: {
    type: Boolean,
    required: false
  },
  about: {
    type: String,
    required: false // Assuming this is optional
  },
  savedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
});

module.exports = mongoose.model('User', UserSchema);

