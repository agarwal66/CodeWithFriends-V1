// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   googleId: { type: String, required: true },
//   username: String,
//   email: String,
//   photo: String
// });

// module.exports = mongoose.model('User', userSchema);
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // 🔐 Hashed password
  googleId: String, // For Google users
});

module.exports = mongoose.model("User", userSchema);