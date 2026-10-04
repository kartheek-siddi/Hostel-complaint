// db.js
// A real file-on-disk database, just not SQL — stored as JSON in data.json.
// Using only Node's built-in "fs" module means nothing here ever needs
// compiling, which was the recurring Windows build-tools problem with
// better-sqlite3. Reads/writes are synchronous, same as the old version,
// so the rest of the app barely had to change.

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "data.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], complaints: [] };
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Corrupted or empty file — start fresh rather than crash the server.
    return { users: [], complaints: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function nextId(items) {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

module.exports = { readDB, writeDB, nextId };
