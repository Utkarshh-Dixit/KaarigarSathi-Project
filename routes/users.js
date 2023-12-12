
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/kaarigarsathi');

const userSchema = mongoose.Schema({
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
  location: {
    type: String
  },
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

module.exports = mongoose.model("user", userSchema);