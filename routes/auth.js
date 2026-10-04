// routes/auth.js
// Handles account creation and login. Passwords are hashed with bcrypt —
// the real password is never stored or logged anywhere.

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDB, writeDB, nextId } = require("../db");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, room_number: user.room_number },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password, role, room_number, admin_code } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password, and role are required." });
  }
  if (!["student", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'student' or 'admin'." });
  }
  if (role === "admin" && admin_code !== process.env.ADMIN_SIGNUP_CODE) {
    return res.status(403).json({ error: "Invalid admin signup code." });
  }
  if (role === "student" && !room_number) {
    return res.status(400).json({ error: "Room number is required for students." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const data = readDB();

  const existing = data.users.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const user = {
    id: nextId(data.users),
    name,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    role,
    room_number: role === "student" ? room_number : null,
    created_at: new Date().toISOString(),
  };

  data.users.push(user);
  writeDB(data);

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, role: user.role, room_number: user.room_number },
  });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const data = readDB();
  const user = data.users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, room_number: user.room_number },
  });
});

module.exports = router;
