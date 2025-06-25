// const router = require('express').Router();
// const passport = require('passport');

// // Google OAuth routes
// router.get('/google', passport.authenticate('google', {
//   scope: ['profile', 'email']
// }));

// router.get('/google/callback',
//   passport.authenticate('google', {
//     successRedirect: `${process.env.FRONTEND_URL}/dashboard`,
//     failureRedirect: `${process.env.FRONTEND_URL}/login`,
//   })
// );

// // ✅ Logout route
// router.get('/logout', (req, res) => {
//   req.logout(() => {
//     res.redirect(process.env.FRONTEND_URL);
//   });
// });

// // ✅ Export the router only ONCE
// module.exports = router;
// server/authRoutes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("./models/User");
const bcrypt = require("bcrypt");

// ===========================
// 🔐 Google Auth (already working)
// ===========================
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL + "/dashboard",
    failureRedirect: process.env.FRONTEND_URL + "/login",
  })
);

// ===========================
// ✉ Email Registration
// ===========================
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================
// 🔐 Email Login
// ===========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      res.json({ message: "Login successful" });
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================
// ✅ Logout Route
// ===========================
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;