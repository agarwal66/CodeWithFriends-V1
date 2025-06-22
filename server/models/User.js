const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  username: String,
  email: String,
  photo: String
});

module.exports = mongoose.model('User', userSchema);
