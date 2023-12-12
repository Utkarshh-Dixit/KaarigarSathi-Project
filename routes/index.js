var express = require('express');
const passport = require('passport');
const userModel = require('./users');
var router = express.Router();
var flash = require('connect-flash');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/profile', isLoggedIn, function(req, res){
  res.render('profile');
});


router.post('/register', function(req, res){
  const { mobile, username, email, name, location} = req.body;
  const userData = new userModel({mobile, username, email, name, location});

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
});

router.get('/login', function(req, res){
  res.render('login');
});

router.post('/login', passport.authenticate("local", {
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

module.exports = router;
