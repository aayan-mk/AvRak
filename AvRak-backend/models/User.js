const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  mobile: String,
  emergencyContact: String,
  address: String,
  bloodGroup: String,
  gender: String,
  photoURL: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
