const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

// Get Profile
router.get("/:username", auth.optionalVerify, async (req, res, next) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        errors: {
          error: `${username} is not in database`,
        },
      });
    }
    if (req.user) {
      const currentUser = await User.findById(req.user.userId);
      const isFollowing = currentUser.following.includes(user._id);
      return res.status(200).json({ profile: user.profileJSON(isFollowing) });
    } else {
      res.status(200).json({ profile: user.profileJSON(false) });
    }
  } catch (error) {
    next(error);
  }
});

// Follow user
router.post("/:username/follow", auth.verifyToken, async (req, res, next) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username });
    console.log("user", user);
    if (!user) {
      return res.status(400).json({
        errors: {
          error: `${username} is not in database`,
        },
      });
    }
    console.log(user.id, req.user.userId);
    if (user.id === req.user.userId) {
      return res.status(400).json({
        errors: {
          error: "You cannot follow/unfollow yourself",
        },
      });
    }
    const currentUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $addToSet: { following: user._id },
      },
      { new: true }
    );
    res.status(200).json({ profile: user.profileJSON(true) });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Unfollow user
router.delete("/:username/follow", auth.verifyToken, async (req, res, next) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        errors: {
          error: `${username} is not in database`,
        },
      });
    }
    if (user.id === req.user.userId) {
      return res.status(400).json({
        errors: {
          error: "You cannot follow/unfollow yourself",
        },
      });
    }
    const currentUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $pull: { following: user._id },
      },
      { new: true }
    );
    res.status(200).json({ profile: user.profileJSON(false) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
