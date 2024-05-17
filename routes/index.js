var express = require("express");
const passport = require("passport");
const googleMaps = require("@google/maps");
const axios = require("axios");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const userModel = require("./users");
const Requirement = require("./requirements");
var router = express.Router();
var flash = require("connect-flash");
const chatModel = require("./chatModel");
const Message = require("./messageModel");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { error: "" });
});

router.post("/messages", async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if a chat already exists between the users
    let chat = await chatModel.findOne({
      users: { $all: [senderId, receiverId] },
    });

    // If no chat exists, create a new one
    if (!chat) {
      chat = await chatModel.create({
        chatName: "Chat between users",
        users: [senderId, receiverId],
      });
    }

    // Create a new message
    const newMessage = await Message.create({
      sender: senderId,
      content: content,
      chat: chat._id,
    });

    // Update the latestMessage field in the corresponding chat
    chat.latestMessage = newMessage._id;
    await chat.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET endpoint to fetch chat messages
router.get("/chats/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username") // Assuming 'username' is a field in your User model
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET endpoint to fetch chat page
router.get("/chat/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const useridd = await userModel.findById(req.params.id);
    let chat = await chatModel.findOne({
      users: { $all: [userId, useridd._id] },
    });
    if (!chat) {
      chat = await chatModel.create({
        chatName: "Chat between users",
        users: [userId, useridd._id],
      });
    }
    await chat.save();
    const messages = await Message.find({ chat: chat._id }).populate(
      "sender",
      "username"
    );
    console.log(messages);
    res.render("chatPage", { userId, useridd, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST endpoint to access or create a chat
router.post("/accessChat", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    let isChat = await chatModel
      .find({
        $and: [
          { users: { $elemMatch: { $eq: req.user._id } } },
          { users: { $elemMatch: { $eq: userId } } },
        ],
      })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await userModel.populate(isChat, {
      path: "latestMessage.sender",
      select: "name mobile",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        chatName: "sender",
        users: [req.user._id, userId],
      };

      const newChat = await chatModel.create(chatData);
      const fullChat = await chatModel
        .findOne({ _id: newChat._id })
        .populate("users", "-password");
      res.status(200).send(fullChat);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET endpoint to fetch user's chats
router.get("/fetchChat", async (req, res) => {
  try {
    const chats = await chatModel
      .find({
        users: { $elemMatch: { $eq: req.user._id } },
      })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const result = await userModel.populate(chats, {
      path: "latestMessage.sender",
      select: "name mobile",
    });
    res.status(200).send(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/customer", async function (req, res, next) {
  const successMessage = req.flash("success")[0];

  const users = await userModel.find();
  res.render("customer", { users, successMessage });
});

router.post("/post-requirement", async (req, res) => {
  try {
    const { kaarigarType, description } = req.body;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

    const newRequirement = new Requirement({
      User: req.user._id, // Assuming you have the user's ID from the session
      kaarigarType,
      description,
      createdAt,
      expiresAt,
    });

    await newRequirement.save();
    req.flash("success", "Requirements posted successfully.");
    res.redirect("/customer"); // Redirect after saving
  } catch (err) {
    console.error(err);
    res.status(500).send("Error posting requirement");
  }
});

router.get("/checking", function (req, res, next) {
  res.render("checking");
});

router.get("/requirement", function (req, res, next) {
  res.render("requirement");
});

router.get("/about", function (req, res) {
  res.render("about");
});

router.get("/cv", function (req, res) {
  res.render("check");
});

router.post("/check/sendVerificationCode", async (req, res) => {
  try {
    const { mobile } = req.body;

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(mobile, { expiresIn: 5 * 60 * 1000 });

    res.cookie("session", sessionCookie, {
      expires: new Date(Date.now() + 5 * 60 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ message: "Verification code sent successfully." });
    res.redirect("/checkverify");
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/check/verifyCode", async (req, res) => {
  try {
    const { code } = req.body;

    const sessionCookie = req.cookies.session || "";
    const user = await admin.auth().verifySessionCookie(sessionCookie);
    const userFromDB = await userModel.findOne({ mobile: user.mobile });

    if (userFromDB && userFromDB.verificationCode === code) {
      // Code is valid
      res.status(200).json({ message: "Code verified successfully.", user });
    } else {
      // Code is invalid
      res.status(400).json({ error: "Invalid verification code." });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/kaarigar", async function (req, res, next) {
  const requirements = await Requirement.find().populate("User");
  console.log(requirements);
  res.render("kaarigar", { requirements });
});

router.get("/details", async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("details", { user });
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  // const kaarigar = await kaarigarModel.findOne({username: req.session.passport.kaarigar});
  // if(user)
  // const coordinates = await getCoordinates(user.locationName);
  // console.log(coordinates);
  res.render("profile", { user });
  // else res.render('profile', {kaarigar});
});

router.post("/editdetails", async function (req, res) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    {
      mobile: req.body.mobile,
      name: req.body.name,
      email: req.body.email,
      locationName: req.body.locationName,
      username: req.body.username,
    },
    { new: true }
  );
  await user.save();
  res.redirect("profile");
});

router.post("/save-location", async (req, res) => {
  const { lat, lng } = req.query;

  console.log(lat);
  console.log(lng);

  try {
    // Make a request to OpenStreetMap Nominatim API
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lng),
          format: "json",
          addressdetails: 1,
        },
      }
    );

    // Extract the address or location name from the API response
    const locationName = response.data.display_name;
    console.log(locationName);
    const user = await userModel.findOneAndUpdate(
      { username: req.session.passport.user },
      { locationName: locationName, lat: lat, long: lng },
      { new: true }
    );
    await user.save();
    console.log(user);
    res.render("profile");
  } catch (error) {
    console.error(
      "Error converting coordinates to location name:",
      error.message
    );
    res
      .status(500)
      .json({ error: "Error converting coordinates to location name" });
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

// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//       user: 'utkarshdixit.2k21@gmail.com',
//       pass: 'hxzljnowtchasvxu'
//   }
// });

// let otpStorage = {};

// const twilioClient = twilio('ACbdaaa4fea770e8742a52a0764b4cf5e8', 'de41a802edaa78ef7747ba16033e460b');

router.post("/register", async function (req, res) {
  const {
    selectedOption,
    mobile,
    username,
    email,
    name,
    locationName,
    profession,
  } = req.body;

  if (
    !username ||
    !name ||
    !mobile ||
    !email ||
    !selectedOption ||
    !locationName
  ) {
    return res.redirect("/");
  }
  let newUser;
  if (profession !== "") {
    newUser = new userModel({
      selectedOption: selectedOption,
      profession: profession,
      email: email,
      mobile: mobile,
      username: username,
      name: name,
      locationName: locationName,
    });
  } else {
    newUser = new userModel({
      selectedOption: selectedOption,
      mobile: mobile,
      email: email,
      username: username,
      name: name,
      locationName: locationName,
    });
  }

  userModel
    .register(newUser, req.body.password)
    .then(() => {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/", { error: err });
    });
  // Generate OTP
  // const otp = crypto.randomInt(100000, 999999).toString();

  // // Store user data and OTP in session
  // req.session.userData = {
  //   selectedOption,
  //   mobile,
  //   username,
  //   name,
  //   locationName,
  //   otp
  // };

  // // Send OTP via Twilio
  // try {
  //   await twilioClient.messages.create({
  //     body: `Your OTP is: ${otp}`,
  //     from: '+916394924092',
  //     to: `+${mobile}`
  //   });

  //   res.render('verifyOtp', { mobile });
  // } catch (error) {
  //   console.error('Error sending OTP via Twilio:', error.message);
  //   res.status(500).send('Error sending OTP');
  // }
});

// router.post('/verify-otp', (req, res) => {
//   const { mobile, otp } = req.body;
//   const userData = req.session.userData;

//   if (!userData) {
//     return res.send('OTP session expired or invalid.');
//   }

//   if (userData.otp === otp) {
//     const newUser = new userModel({
//       selectedOption: userData.selectedOption,
//       mobile: userData.mobile,
//       username: userData.username,
//       name: userData.name,
//       locationName: userData.locationName
//     });

//     userModel.register(newUser, userData.password)
//       .then(() => {
//         passport.authenticate("local")(req, res, function() {
//           delete req.session.userData;
//           res.redirect("/profile");
//         });
//       })
//       .catch((err) => {
//         console.error(err);
//         res.redirect('/', { error: err });
//       });
//   } else {
//     res.send('Invalid OTP.');
//   }
// });

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

router.get("/login", function (req, res) {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
    failureFlash: true,
  }),
  function (req, res) {}
);

router.use((req, res, next) => {
  res.locals.errorMessage = req.flash("error"); // 'error' is the key used by passport for flash messages
  next();
});

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
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
