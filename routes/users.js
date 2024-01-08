
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/kaarigarsathi');

const userSchema = mongoose.Schema({
  profession: String,
  selectedOption: String,
  mobile: {
    type: Number,
    required: true
  },
  name: {
    type: String
  }, 
  username: {
    type: String,
    unique: true,
  },
  locationName: {
    type: String
  },
  lat: Number,
  long: Number,
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(plm);

module.exports = mongoose.model("User", userSchema);

