const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: String,
  createdBy: String,         // user email or id
  participants: [String],    // array of emails or names
  codeContent: String,       // latest code
  chatHistory: [
    {
      sender: String,
      message: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
