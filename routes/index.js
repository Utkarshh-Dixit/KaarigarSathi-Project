var express = require('express');
const passport = require('passport');
const googleMaps = require('@google/maps');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const userModel = require('./users');
var router = express.Router();
var flash = require('connect-flash');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/customer', async function(req, res, next) {
  const users = await userModel.find();
  res.render('customer', {users});
});

router.get('/checking', function(req, res, next) {
  res.render('checking');
});

router.get('/kaarigar', function(req, res, next) {
  res.render('kaarigar');
});

router.get('/details', async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('details', {user});
});

router.get('/profile', async function(req, res){
  
  const user = await userModel.findOne({username: req.session.passport.user});
  // const kaarigar = await kaarigarModel.findOne({username: req.session.passport.kaarigar});
  // if(user)
  // const coordinates = await getCoordinates(user.locationName);
  // console.log(coordinates);
  res.render('profile', {user});
  // else res.render('profile', {kaarigar});
});

router.post('/editdetails', async function(req, res){
  const user = await userModel.findOneAndUpdate(
    {username: req.session.passport.user},
     {mobile: req.body.mobile,
    name: req.body.name,
     email: req.body.email,
locationName: req.body.locationName,
username: req.body.username},
      {new: true});
      await user.save();
      res.redirect('profile');
})

router.post('/save-location', async (req, res) => {
  const { lat, lng } = req.query;
  
  console.log(lat);
  console.log(lng);

  try {
    // Make a request to OpenStreetMap Nominatim API
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
            lat: parseFloat(lat),
            lon: parseFloat(lng),
            format: 'json',
            addressdetails: 1,
        },
    });

    // Extract the address or location name from the API response
    const locationName = response.data.display_name;
    console.log(locationName);
    const user = await userModel.findOneAndUpdate({username: req.session.passport.user}, {locationName: locationName}, {new: true});
    await user.save();
    console.log(user);
    res.render('profile');
} catch (error) {
    console.error('Error converting coordinates to location name:', error.message);
    res.status(500).json({ error: 'Error converting coordinates to location name' });
}
  // Create a new user document with the location data
  // const newUser = new userModel({
  //     username: 'exampleUsername', // Use the actual username or user ID
  //     location: {
  //         type: 'Point',
  //         coordinates: [parseFloat(lng), parseFloat(lat)],
  //     },
  // });

  // try {
  //     // Save the user document to the database
  //     const savedUser = await newUser.save();
  //     res.json({ message: 'Location saved successfully', user: savedUser });
  // } catch (error) {
  //     res.status(500).json({ error: 'Error saving location', message: error.message });
  // }
});

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'utkarshdixit.2k21@gmail.com',
      pass: 'hxzljnowtchasvxu'
  }
});

let otpStorage = {};

router.post('/register', async function(req, res){
      const {selectedOption, mobile, username, email, name, locationName} = req.body;

      if (!username || !email || !name || !mobile || !selectedOption || !locationName) {
        
        return res.redirect('/');
      }

      const otp = crypto.randomInt(100000, 999999).toString();

    otpStorage[email] = { ...req.body, otp };

    let mailOptions = {
        from: 'utkarshdixit.2k21@gmail.com',
        to: email,
        subject: 'Your OTP',
        text: `Your OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            res.send('Error sending OTP');
        } else {
            res.render('verifyOtp', { email, username, name, mobile, locationName, selectedOption });
        }
    });
      
});


// const userData = new userModel({
//   profession: req.body.profession,
//   selectedOption: selectedOption,
//    mobile:mobile, 
//    username: username, 
//    email: email, 
//    name:name, 
//    locationName: locationName 
//   });

//   userModel.register(userData, req.body.password)
//     .then(function(){
//       passport.authenticate("local")(req, res, function(){
//         res.redirect("/profile");
//       });
//     })
//     .catch(function(err){
//       // Handle registration errors here
//       console.error(err);
//       // Redirect to an error page or handle it as needed
//       res.redirect('/');
//     });
// // }

router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const userData = otpStorage[email];
  if (!userData) {
    return res.send('OTP session expired or invalid.');
}


if (userData.otp === otp) {
    const newUser = new userModel({
        selectedOption: userData.selectedOption,
        mobile: userData.mobile,
        username: userData.username,
        email: email,
        name: userData.name,
        locationName: userData.locationName
    });
    console.log(newUser);

    
    
  userModel.register(newUser, userData.password)
  .then(function(){
    console.log("yha aa gya");
    passport.authenticate("local")(req, res, function(){
      console.log("yha bhi aa gya");
      // delete otpStorage[email];
      res.redirect("/profile");
    });
  })
  .catch(function(err){
    // Handle registration errors here
    console.error(err);
    // Redirect to an error page or handle it as needed
    res.redirect('/');
  });
    // userModel.register(newUser, userData.password, function(err, user) {
    //     if (err) {
    //         console.log(err);
    //         return res.render('index', { errorMessage: 'Error in registration' });
    //     }

    //     passport.authenticate("local")(req, res, function() {
    //         delete otpStorage[email];
    //         res.redirect('/profile'); // Redirect to the profile page after successful registration
    //     });
    // });
} else {
    res.send('Invalid OTP.');
}
});


// router.get('/nearby-users', async (req, res) => {
//   try {
//       // Retrieve nearby users (adjust the distance as needed)
//       const nearbyUsers = await userModel.find({
//           location: {
//               $near: {
//                   $geometry: { type: 'Point', coordinates: [/* current user's longitude */, /* current user's latitude */] },
//                   $maxDistance: 10000, // in meters (adjust as needed)
//               },
//           },
//       });

//       res.render('nearby-users', { nearbyUsers });
//   } catch (error) {
//       res.status(500).send('Error retrieving nearby users');
//   }
// });

router.get('/login', function(req, res){
  res.render('login');
});

router.post('/login',passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/",
  failureFlash: true
}), function(req, res){});

router.use((req, res, next) => {
  res.locals.errorMessage = req.flash('error'); // 'error' is the key used by passport for flash messages
  next();
});

router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

// async function getCoordinates(locationName) {
//   return new Promise((resolve, reject) => {
//     const googleMapsClient = googleMaps.createClient({
//       key: 'AIzaSyBMJqLS8IjujQzkM8UD5iMfuhKRL1twaSc', // Replace with your API key
//     });

//     googleMapsClient.geocode({
//       address: locationName,
//     }, (err, response) => {
//       if (!err) {
//         console.log('Geocoding Response:', response.json);
//         const location = response.json.results[0].geometry.location;
//         resolve({ latitude: location.lat, longitude: location.lng });
//       } else {
//         console.error('Geocoding Error:', err);
//         reject(new Error('No results found for the provided location name.'));
//       }
//     });
//   });
// }

module.exports = router;
