const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String },
    image: { type: String },
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    const hashed = await bcrypt.hash(this.password, 10);
    this.password = hashed;
  }
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  let update = { ...this.getUpdate() };
  if (update.password) {
    const hashed = await bcrypt.hash(update.password, 10);
    update.password = hashed;
    this.setUpdate(update);
  }
  next();
});

userSchema.methods.verifyPassword = async function (password) {
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    return error;
  }
};

userSchema.methods.signToken = async function () {
  const payload = {
    email: this.email,
    userId: this.id,
  };
  try {
    const token = await jwt.sign(payload, process.env.JWT_TOKEN_SECRET);
    return token;
  } catch (error) {
    return error;
  }
};

userSchema.methods.userJSON = function (token) {
  return {
    email: this.email,
    token: token,
    username: this.username,
    bio: this.bio,
    image: this.image,
  };
};

userSchema.methods.profileJSON = function (isFollowing) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image,
    following: isFollowing,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
