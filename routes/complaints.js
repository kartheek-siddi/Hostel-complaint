// routes/complaints.js
// Students can create complaints and see only their own.
// Admins can see, filter, update status/remarks on, and delete any complaint.

const express = require("express");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { classifyPriority, PRIORITY_RANK } = require("../utils/priority");

const router = express.Router();
router.use(requireAuth);

function sortByPriorityThenDate(list) {
  return [...list].sort((a, b) => {
    const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.created_at) - new Date(b.created_at); // oldest first within same priority
  });
}

// GET /api/complaints — students see their own; admins see all (with optional filters)
router.get("/", (req, res) => {
  const data = readDB();

  if (req.user.role === "student") {
    const mine = data.complaints.filter((c) => c.user_id === req.user.id);
    return res.json(sortByPriorityThenDate(mine));
  }

  // Admin: support ?status=&category=&search=
  const { status, category, search } = req.query;
  let list = data.complaints.map((c) => {
    const student = data.users.find((u) => u.id === c.user_id);
    return {
      ...c,
      student_name: student ? student.name : "Unknown",
      room_number: student ? student.room_number : "Unknown",
    };
  });

  if (status) list = list.filter((c) => c.status === status);
  if (category) list = list.filter((c) => c.category === category);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.student_name.toLowerCase().includes(s) ||
        (c.room_number || "").toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s)
    );
  }

  res.json(sortByPriorityThenDate(list));
});

// POST /api/complaints — student submits a new complaint
router.post("/", (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Only students can submit complaints." });
  }
  const { category, description } = req.body;
  if (!category || !description) {
    return res.status(400).json({ error: "Category and description are required." });
  }

  // Priority is assigned automatically from the description text —
  // students don't self-select it, which keeps the signal honest.
  const priority = classifyPriority(description);

  const data = readDB();
  const now = new Date().toISOString();

  const complaint = {
    id: nextId(data.complaints),
    user_id: req.user.id,
    category,
    priority,
    description,
    status: "Pending",
    remarks: "",
    created_at: now,
    updated_at: now,
  };

  data.complaints.push(complaint);
  writeDB(data);

  res.status(201).json(complaint);
});

// PATCH /api/complaints/:id — admin updates status and/or remarks
router.patch("/:id", requireAdmin, (req, res) => {
  const { status, remarks } = req.body;
  const id = Number(req.params.id);

  const data = readDB();
  const complaint = data.complaints.find((c) => c.id === id);
  if (!complaint) return res.status(404).json({ error: "Complaint not found." });

  if (status !== undefined) complaint.status = status;
  if (remarks !== undefined) complaint.remarks = remarks;
  complaint.updated_at = new Date().toISOString();

  writeDB(data);
  res.json(complaint);
});

// DELETE /api/complaints/:id — admin only
router.delete("/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const data = readDB();

  const before = data.complaints.length;
  data.complaints = data.complaints.filter((c) => c.id !== id);

  if (data.complaints.length === before) {
    return res.status(404).json({ error: "Complaint not found." });
  }

  writeDB(data);
  res.json({ success: true });
});

module.exports = router;
