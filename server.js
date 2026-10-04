// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");

if (!process.env.JWT_SECRET || !process.env.ADMIN_SIGNUP_CODE) {
  console.error(
    "Missing JWT_SECRET or ADMIN_SIGNUP_CODE. Copy .env.example to .env and fill in real values first."
  );
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

// Serve the frontend
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hostel Complaint System running at http://localhost:${PORT}`);
});
