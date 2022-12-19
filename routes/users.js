var express = require("express");
const User = require("../models/User");
var router = express.Router();

// Registration
router.post("/", async (req, res, next) => {
  let userEmail, userUsername;
  try {
    userEmail = await User.findOne({ email: req.body.user.email });
    userUsername = await User.findOne({ username: req.body.user.username });

    if (userEmail && userUsername) {
      return res.status(422).json({
        errors: {
          email: "is already taken",
          username: "is already taken",
        },
      });
    }
    if (userEmail) {
      return res.status(422).json({
        errors: {
          email: "is already taken",
        },
      });
    }
    if (userUsername) {
      return res.status(422).json({
        errors: {
          username: "is already taken",
        },
      });
    }

    const newUser = await User.create(req.body.user);
    const token = await newUser.signToken();
    res.status(200).json({ user: newUser.userJSON(token) });
  } catch (error) {
    next(error);
  }
});

// Authentication
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body.user;

  if (!email || !password) {
    return res.status(422).json({
      errors: {
        email: "can't be empty",
        password: "can't be empty",
      },
    });
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(422).json({
        errors: {
          email: "email is not register",
        },
      });
    }

    const result = await user.verifyPassword(password);

    if (!result) {
      return res.status(422).json({
        errors: {
          password: "invalid password",
        },
      });
    }
    const token = await user.signToken();
    res.status(200).json({ user: user.userJSON(token) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
