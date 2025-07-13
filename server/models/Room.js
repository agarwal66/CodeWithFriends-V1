const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: String,
  createdBy: String,
  participants: [String],
  codeContent: String,
  chatHistory: [
    {
      sender: String,
      message: String
    }
  ]
}, {
  timestamps: true // ✅ This auto adds createdAt and updatedAt
});

module.exports = mongoose.model("Room", roomSchema);