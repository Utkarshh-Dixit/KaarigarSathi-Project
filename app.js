var createError = require("http-errors");
var express = require("express");
var path = require("path");
const mongoose = require("mongoose");
var app = express();
const flash = require("connect-flash");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var Session = require("express-session");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var chatRouter = require("./routes/chatModel");
const passport = require("passport");
const bodyParser = require("body-parser");
const { type } = require("os");

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCTU-pVG1csyuk866FvbPUJgpfPp0QaBNo",
//   authDomain: "kaarigar-sathi.firebaseapp.com",
//   projectId: "kaarigar-sathi",
//   storageBucket: "kaarigar-sathi.appspot.com",
//   messagingSenderId: "59795869714",
//   appId: "1:59795869714:web:14f85c18628441fb1a48cb",
//   measurementId: "G-MCYC9J5YPX"
// };

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// var admin = require("firebase-admin");

// var serviceAccount = require("fire.json");

const localStrategy = require("passport-local");
passport.use(new localStrategy(usersRouter.authenticate()));
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(flash());
app.use(
  Session({
    resave: false,
    saveUninitialized: false,
    secret: "Anything",
  })
);

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
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/chat", chatRouter);
// app.use('/kaarigar', kaarigarRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
