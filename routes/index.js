var express = require("express");
const auth = require("../middleware/auth");
const Article = require("../models/Article");
const User = require("../models/User");
var router = express.Router();

/* GET home page. */
router.get("/tags", async function (req, res, next) {
  try {
    const tags = await Article.distinct("tagList");
    res.status(200).json({ tags });
  } catch (error) {
    next(error);
  }
});

// router.use(auth.verifyToken);

// Get Current User
router.get("/user", auth.verifyToken, async (req, res, next) => {
  const { userId } = req.user;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ errors: { error: "You are not logged in" } });
    }
    res
      .status(200)
      .json({ user: user.userJSON(req.headers.authorization.split(" ")[1]) });
  } catch (error) {
    next(error);
  }
});

// Update User
router.put("/user", auth.verifyToken, async (req, res, next) => {
  const { userId } = req.user;
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, req.body.user, {
      new: true,
    });
    res
      .status(200)
      .json({
        user: updatedUser.userJSON(req.headers.authorization.split(" ")[1]),
      });
  } catch (error) {
    next(error);
  }
});

// router.put("/user", auth.verifyToken, async (req, res, next) => {
//   const { userId } = req.user;
//   try {
//     let user = await User.findById(userId);
//     const newUser = new User({});
//     newUser.username = req.body.username ? req.body.username : user.username;
//     newUser.email = req.body.email ? req.body.email : user.email;
//     newUser.password = req.body.password ? req.body.password : user.password;
//     newUser.bio = req.body.bio ? req.body.bio : user.bio;
//     newUser.image = req.body.image ? req.body.image : user.image;
//     newUser = await newUser.save();
//     console.log(newUser);

//     // res.status(200).json({ user: user.userJSON(req.headers.authorization) });
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// });

module.exports = router;
