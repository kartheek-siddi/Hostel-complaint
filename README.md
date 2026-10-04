# Hostel Complaint Management System (Backend Version)

A real client-server app: Node.js + Express API, a SQLite database file on
disk, hashed passwords (bcrypt), and JWT-based login — the proper way to
build this, instead of the browser-only localStorage version.

## What's different from the localStorage version

| | Browser-only version | This version |
|---|---|---|
| Data storage | Browser localStorage (per-device, insecure) | Real SQLite database file (`hostel.db`) |
| Passwords | None (just typed name) | Hashed with bcrypt, never stored in plain text |
| Login | Fake, no real check | JWT token issued on login, checked on every request |
| Multi-device | No — data stuck on one browser | Yes — any device can log in and see the same data |
| Admin access | Hardcoded passcode in the HTML (visible to anyone) | Signup code kept server-side in `.env`, never shipped to the browser |

## Setup

1. **Install Node.js** (v18 or newer) if you don't have it: https://nodejs.org

2. **Install dependencies** — open a terminal in this folder and run:

   ```
   npm install
   ```

3. **Set up your environment variables**:

   ```
   cp .env.example .env
   ```

   Then open `.env` and change `JWT_SECRET` and `ADMIN_SIGNUP_CODE` to your
   own values (any random strings work — these aren't sent anywhere, they're
   just used locally to sign tokens and gate admin signups).

4. **Start the server**:

   ```
   npm start
   ```

5. Open **http://localhost:3000** in your browser.

6. **Create accounts**:
   - Register as a **Student** (name, email, password, room number).
   - Register as an **Admin** — you'll need the `ADMIN_SIGNUP_CODE` you set
     in `.env`. This keeps random people from making themselves admin.

That's it — the SQLite database file (`hostel.db`) is created automatically
on first run, in this same folder.

## Project structure

```
hostel-backend/
├── server.js           # Express app entry point
├── db.js                # SQLite connection + table schema
├── middleware/auth.js   # JWT verification
├── routes/auth.js       # Register / login endpoints
├── routes/complaints.js # Complaint CRUD endpoints
├── public/               # Frontend (served by Express)
│   ├── index.html
│   └── app.js
├── .env.example
└── package.json
```

## API endpoints (for reference / testing with Postman etc.)

- `POST /api/auth/register` — create a student or admin account
- `POST /api/auth/login` — returns a JWT token
- `GET /api/complaints` — list complaints (own, if student; all + filters, if admin)
- `POST /api/complaints` — submit a complaint (student only)
- `PATCH /api/complaints/:id` — update status/remarks (admin only)
- `DELETE /api/complaints/:id` — delete a complaint (admin only)

All routes except register/login require an `Authorization: Bearer <token>`
header — the frontend handles this automatically after login.

## If `npm install` fails on `better-sqlite3`

This usually means your system is missing build tools for native modules.
- **Windows**: install the "Desktop development with C++" workload via
  Visual Studio Build Tools, or try `npm install --global windows-build-tools`
  (run as administrator).
- **Mac**: run `xcode-select --install`.
- **Linux**: `sudo apt install build-essential python3`.

Then retry `npm install`.

## Automatic priority detection

Students no longer pick a priority level themselves — it's assigned
automatically by scanning their complaint description for urgency signals
(`utils/priority.js`). For example:

- **Emergency**: "gas leak", "fire", "electric shock", "flooding", "trapped", etc.
- **High**: "no water", "no electricity", "security", "theft", "broken lock", etc.
- **Low**: "minor", "cosmetic", "suggestion", etc.
- **Medium**: the default, for everything else.

Emergency complaints always sort to the very top of both the student's own
list and the admin's list, and the admin dashboard shows a red banner
listing every unresolved emergency the moment one exists.

This is a simple, explainable keyword system — good for a portfolio project
because you can point to exactly *why* something got flagged. A production
version might instead use a trained text-classification model, but keyword
matching is the right starting point and is easy to extend (just add more
terms to the lists in `utils/priority.js`).

**If you already have an existing `hostel.db` file** from before this
update, delete it before running `npm start` again — the database schema
changed to allow the new "Emergency" priority level, and SQLite won't
retroactively update an existing table's constraints. Deleting it just
means starting with an empty complaints list again.

## Next steps to level this up further

- Add **rate limiting** on the login route (prevents brute-force password guessing)
- Add **email verification** on signup
- Move from SQLite to **PostgreSQL** once you're ready to deploy somewhere
  real (SQLite is great for learning/local use, but a hosted multi-user app
  usually wants a proper database server)
- Deploy it: Render or Railway both offer free tiers that work well for a
  small Node + SQLite app like this
