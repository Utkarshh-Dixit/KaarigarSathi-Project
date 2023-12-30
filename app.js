var createError = require('http-errors');
var express = require('express');
var path = require('path');
const mongoose = require('mongoose');
var app = express();
const flash = require('express-flash');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Session = require('express-session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require('passport');
const { type } = require('os');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(Session({
  resave: false,
  saveUninitialized: false,
  secret: 'Anything'
}));

app.use(passport.initialize());
app.use(passport.session());
// if(usersRouter){
  // passport.serializeUser(usersRouter.serializeUser() || kaarigarRouter.serializeUser());
  // passport.deserializeUser(usersRouter.deserializeUser() || kaarigarRouter.deserializeUser());
// }
// if(kaarigarRouter){
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());
// }

// passport.serializeUser((userr, done) => {
//   done(null, { id: userr._id, type: userr.constructor.modelName });
// });
// passport.deserializeUser(async (serializedUser, done) => {
//   const { id, type } = serializedUser;
//   console.log(id, type);
//   try {
//     let userr;
//     if (type === 'user') {
//       userr = await usersRouter.findById(id);
//     } else if (type === 'kaarigar') {
//       userr = await kaarigarRouter.findById(id);
//     }

//     done(null, userr);
//   } catch (error) {
//     done(error);
//   }
// });
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// app.use('/kaarigar', kaarigarRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
