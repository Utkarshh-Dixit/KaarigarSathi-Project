var createError = require('http-errors');
var express = require('express');
var path = require('path');
var app = express();
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Session = require('express-session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var kaarigarRouter = require('./routes/kaarigar');
const passport = require('passport');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(Session({
  resave: false,
  saveUninitialized: false,
  secret: 'Anything'
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(kaarigarRouter.serializeUser());
passport.deserializeUser(kaarigarRouter.deserializeUser());
// passport.serializeUser((user, done) => {
//   console.log('Serializing user:', user);
//   done(null, { id: user.id, userType: user.constructor.modelName });
// });

// passport.deserializeUser(async (serializedUser, done) => {
//   console.log('Deserializing user:', serializedUser);
//   const model = mongoose.model(serializedUser.userType);

//   try {
//     const user = await model.findById(serializedUser.id);
//     done(null, user);
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
app.use('/kaarigar', kaarigarRouter);

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
