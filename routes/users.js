const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

//Password -> nXPmhBvjeo60ieQ9
//username ->

//Access token for neurelo -> neurelo_9wKFBp874Z5xFw6ZCfvhXQGR5GUpelmqGcDJZffSjcj3ao3ixue6owc6xI/FrRdMuXH3WizHBdEd/WRDl+AVOhp/0xYaXTPWyB9VqmjgpepDyKzv4lXR388sFjxbTfBDYEBteo/XOy0CpsjZZR3yglsU2ZMwOe1c3WpiFMZWmRLPSo9eGD3ZtvOqEM9onJFG_qmtstSTYaITEAg0PNZgQ84BtgMMK8En2Nnikw/8z2Ho=

mongoose.connect(
  "mongodb+srv://utkarshdixit:b8fSQeGk8QY4n0yv@kaarigarsathidatabasecl.sp1e2oo.mongodb.net/?retryWrites=true&w=majority&appName=KaarigarSathiDatabaseCluster"
);

const userSchema = mongoose.Schema(
  {
    profession: String,
    selectedOption: String,
    mobile: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
    },
    username: {
      type: String,
      unique: true,
    },
    locationName: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(plm);

module.exports = mongoose.model("User", userSchema);
