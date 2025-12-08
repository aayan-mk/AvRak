const User = require("../models/User");
const cloudinary = require("../utils/upload");

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const { address, bloodGroup, gender, emergencyContact } = req.body;

  let update = { address, bloodGroup, gender, emergencyContact };

  if (req.body.image) {
    const upload = await cloudinary.uploader.upload(req.body.image);
    update.photoURL = upload.secure_url;
  }

  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });

  res.json(user);
};
