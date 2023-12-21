var express = require('express');
const passport = require('passport');
const googleMaps = require('@google/maps');
const axios = require('axios');
const userModel = require('./users');
const kaarigarModel = require('./kaarigar');
var router = express.Router();
var flash = require('connect-flash');
const localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy(kaarigarModel.authenticate()));
// passport.use('kaarigar-local', new localStrategy(kaarigarModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/customer', function(req, res, next) {
  res.render('customer');
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

router.get('/profile', isLoggedIn, async function(req, res){
  
  const user = await userModel.findOne({username: req.session.passport.user});
  const kaarigar = await kaarigarModel.findOne({username: req.session.passport.kaarigar});
  if(user)
  // const coordinates = await getCoordinates(user.locationName);
  // console.log(coordinates);
  res.render('profile', {user});
  else res.render('profile', {kaarigar});
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

router.post('/register', async function(req, res){
  // const { mobile, username, email, name, locationName } = req.body;
    // const coordinates = await getCoordinates(locationName);
    
    // if (!coordinates) {
      //   // Handle the case when no coordinates are found
      //   return res.status(400).send('Error: Could not find coordinates for the provided location name.');
      // }
      
      const {selectedOption} = req.body;
      if(selectedOption === "vendor"){
        const kaarigarData = new kaarigarModel({
          selectedOption: selectedOption,
          mobile:req.body.mobile, 
          username: req.body.username, 
          email: req.body.email, 
          name:req.body.name, 
          locationName: req.body.locationName,
          profession: req.body.profession
        });
        kaarigarModel.register(kaarigarData, req.body.password)
          .then(function(){
            passport.authenticate("local")(req, res, function(){
              res.redirect("/profile");
            })
          })
    }
    else{
    const userData = new userModel({
      selectedOption: selectedOption,
       mobile:req.body.mobile, 
       username: req.body.username, 
       email: req.body.email, 
       name:req.body.name, 
       locationName: req.body.locationName 
      });
      userModel.register(userData, req.body.password)
        .then(function(){
          passport.authenticate("local")(req, res, function(){
            res.redirect("/profile");
          })
        })
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
  failureRedirect: "/"
}), function(req, res){});


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
