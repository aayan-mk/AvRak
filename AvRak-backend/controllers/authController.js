const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================================
// REGISTER USER
// ==========================================================
exports.register = async (req, res) => {
  try {
    let { name, email, password, mobile } = req.body;

    // Normalize input
    email = email?.trim().toLowerCase();
    name = name?.trim();

    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      emergencyContact: "",
      createdAt: Date.now(),
    });

    res.json({
      msg: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ msg: "Server error, please try again" });
  }
};

// ==========================================================
// LOGIN USER
// ==========================================================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT token (expires in 7 days)
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Server error, please try again" });
  }
};
