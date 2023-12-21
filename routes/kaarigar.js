
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/kaarigarsathi');

const kaarigarSchema = mongoose.Schema({
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
  // latitude: Number,
  // longitude: Number,
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

kaarigarSchema.plugin(plm);

  module.exports = mongoose.model("kaarigar", kaarigarSchema);
  
