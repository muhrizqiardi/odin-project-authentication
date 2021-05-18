const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.DB_URI;
const PORT = process.env.PORT || 3001;
const Schema = mongoose.Schema;

mongoose.connect(DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  }));

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

// Middleware
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }))

passport.use(
  // Takes a username and password
  new LocalStrategy((username, password, done) => {
    // Find from database with username, and return a callback function 
    User.findOne({ username: username }, (err, user) => {
      // If error
      if (err) {
        return done(err);
      }
      // If the username can't be found
      if (!user) {
        return done(null, false, { message: "Incorrect Username" });
      }
      // If the password is not correct
      if (user.password !== password) {
        return done(null, false, { message: "Incorrect Password" });
      }
      return done(null, user);
    });
  })
);


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// Render index
app.get("/", (req, res) => {
  res.render("index")
})

// Sign up form
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.get("/log-in", (req, res) => res.render("log-in"));

app.post("/sign-up", (req, res, next) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  }).save((err) => {
    if (err) {
      return next(err);
    };
    res.redirect('/')
  });
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })
);

app.listen(PORT, () => {
  console.log("Listening to port " + PORT);
})

