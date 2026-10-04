// app.js — talks to the real Express/SQLite backend over fetch(), using a JWT for auth.

const API = "/api";
let token = localStorage.getItem("hostelToken") || null;
let user = JSON.parse(localStorage.getItem("hostelUser") || "null");

function authHeaders() {
  return token ? { Authorization: "Bearer " + token } : {};
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// ---- Login / Register tab switching ----
document.getElementById("tabLogin").addEventListener("click", () => switchAuthTab("login"));
document.getElementById("tabRegister").addEventListener("click", () => switchAuthTab("register"));
function switchAuthTab(which) {
  document.getElementById("tabLogin").classList.toggle("active", which === "login");
  document.getElementById("tabRegister").classList.toggle("active", which === "register");
  document.getElementById("loginForm").classList.toggle("hidden", which !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", which !== "register");
}

let regRole = "student";
document.getElementById("regTabStudent").addEventListener("click", () => setRegRole("student"));
document.getElementById("regTabAdmin").addEventListener("click", () => setRegRole("admin"));
function setRegRole(role) {
  regRole = role;
  document.getElementById("regTabStudent").classList.toggle("active", role === "student");
  document.getElementById("regTabAdmin").classList.toggle("active", role === "admin");
  document.getElementById("regStudentFields").classList.toggle("hidden", role !== "student");
  document.getElementById("regAdminFields").classList.toggle("hidden", role !== "admin");
}

// ---- Login ----
document.getElementById("loginBtn").addEventListener("click", async () => {
  const err = document.getElementById("loginErr");
  err.style.display = "none";
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      }),
    });
    onAuthSuccess(data);
  } catch (e) {
    err.textContent = e.message;
    err.style.display = "block";
  }
});

// ---- Register ----
document.getElementById("registerBtn").addEventListener("click", async () => {
  const err = document.getElementById("regErr");
  err.style.display = "none";
  try {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("regName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        password: document.getElementById("regPassword").value,
        role: regRole,
        room_number: document.getElementById("regRoom").value.trim(),
        admin_code: document.getElementById("regAdminCode").value,
      }),
    });
    onAuthSuccess(data);
  } catch (e) {
    err.textContent = e.message;
    err.style.display = "block";
  }
});

function onAuthSuccess(data) {
  token = data.token;
  user = data.user;
  localStorage.setItem("hostelToken", token);
  localStorage.setItem("hostelUser", JSON.stringify(user));
  enterApp();
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  token = null; user = null;
  localStorage.removeItem("hostelToken");
  localStorage.removeItem("hostelUser");
  document.getElementById("appScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
});

// ---- App shell ----
function enterApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "block";
  document.getElementById("whoLabel").textContent =
    user.role === "student" ? `${user.name} · Room ${user.room_number}` : `${user.name} · Admin`;

  if (user.role === "student") {
    document.getElementById("studentView").classList.remove("hidden");
    document.getElementById("adminView").classList.add("hidden");
    renderStudentView();
  } else {
    document.getElementById("adminView").classList.remove("hidden");
    document.getElementById("studentView").classList.add("hidden");
    renderAdminView();
  }
}

function statusClass(s){ return s === "Pending" ? "pending" : s === "In Progress" ? "progress" : "resolved"; }
function priorityClass(p){ return "priority-" + p.toLowerCase(); }
function escapeHtml(str){ const d=document.createElement("div"); d.textContent=str; return d.innerHTML; }

function makeStatCards(container, list) {
  const counts = {
    total: list.length,
    pending: list.filter(c => c.status === "Pending").length,
    progress: list.filter(c => c.status === "In Progress").length,
    resolved: list.filter(c => c.status === "Resolved").length,
  };
  container.innerHTML = `
    <div class="stat"><div class="num">${counts.total}</div><div class="lbl">Total</div></div>
    <div class="stat"><div class="num" style="color:var(--warn)">${counts.pending}</div><div class="lbl">Pending</div></div>
    <div class="stat"><div class="num" style="color:var(--accent)">${counts.progress}</div><div class="lbl">In Progress</div></div>
    <div class="stat"><div class="num" style="color:var(--ok)">${counts.resolved}</div><div class="lbl">Resolved</div></div>
  `;
}

// ---- Student view ----
async function renderStudentView() {
  const list = await api("/complaints");
  makeStatCards(document.getElementById("studentStats"), list);
  const el = document.getElementById("studentComplaintList");
  if (list.length === 0) { el.innerHTML = `<div class="empty-state">No complaints submitted yet.</div>`; return; }
  el.innerHTML = list.map(c => `
    <div class="complaint">
      <div class="complaint-top">
        <div><div class="complaint-title">${c.category}</div>
        <div class="complaint-meta">Submitted ${new Date(c.created_at).toLocaleString()}</div></div>
        <div style="display:flex;gap:6px;">
          <span class="badge ${priorityClass(c.priority)}">${c.priority}</span>
          <span class="badge ${statusClass(c.status)}">${c.status}</span>
        </div>
      </div>
      <div class="complaint-desc">${escapeHtml(c.description)}</div>
      ${c.remarks ? `<div class="complaint-remarks">Admin remarks: ${escapeHtml(c.remarks)}</div>` : ""}
    </div>
  `).join("");
}

document.getElementById("submitComplaintBtn").addEventListener("click", async () => {
  const err = document.getElementById("submitErr");
  const note = document.getElementById("submitNote");
  err.style.display = "none";
  note.classList.add("hidden");
  const description = document.getElementById("cDesc").value.trim();
  if (!description) { err.textContent = "Please describe the issue."; err.style.display = "block"; return; }
  try {
    const created = await api("/complaints", {
      method: "POST",
      body: JSON.stringify({
        category: document.getElementById("cCategory").value,
        description,
      }),
    });
    document.getElementById("cDesc").value = "";
    note.classList.remove("hidden");
    note.innerHTML = created.priority === "Emergency"
      ? `<span class="badge priority-emergency">Emergency</span> This was flagged as an emergency and sent to the top of the admin queue.`
      : `Submitted — automatically classified as <span class="badge ${priorityClass(created.priority)}">${created.priority}</span> priority.`;
    renderStudentView();
  } catch (e) {
    err.textContent = e.message; err.style.display = "block";
  }
});

// ---- Admin view ----
async function renderAdminView() {
  const status = document.getElementById("filterStatus").value;
  const category = document.getElementById("filterCategory").value;
  const search = document.getElementById("filterSearch").value.trim();

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (search) params.set("search", search);

  const list = await api("/complaints?" + params.toString());
  const allForStats = await api("/complaints"); // unfiltered, for accurate stat totals
  makeStatCards(document.getElementById("adminStats"), allForStats);

  const banner = document.getElementById("emergencyBanner");
  const unresolvedEmergencies = allForStats.filter(c => c.priority === "Emergency" && c.status !== "Resolved");
  if (unresolvedEmergencies.length > 0) {
    banner.classList.remove("hidden");
    banner.innerHTML = `
      <div class="emergency-banner">
        <h4>🚨 ${unresolvedEmergencies.length} unresolved emergency complaint${unresolvedEmergencies.length > 1 ? "s" : ""} — handle these first</h4>
        ${unresolvedEmergencies.map(c => `
          <div class="e-item">• ${escapeHtml(c.category)} — ${escapeHtml(c.student_name)} (Room ${escapeHtml(c.room_number)}): ${escapeHtml(c.description.slice(0, 80))}${c.description.length > 80 ? "…" : ""}</div>
        `).join("")}
      </div>
    `;
  } else {
    banner.classList.add("hidden");
    banner.innerHTML = "";
  }

  const el = document.getElementById("adminComplaintList");
  if (list.length === 0) { el.innerHTML = `<div class="empty-state">No complaints match these filters.</div>`; return; }

  el.innerHTML = list.map(c => `
    <div class="complaint">
      <div class="complaint-top">
        <div><div class="complaint-title">${c.category} — ${escapeHtml(c.student_name)} (Room ${escapeHtml(c.room_number)})</div>
        <div class="complaint-meta">Submitted ${new Date(c.created_at).toLocaleString()}</div></div>
        <div style="display:flex;gap:6px;">
          <span class="badge ${priorityClass(c.priority)}">${c.priority}</span>
          <span class="badge ${statusClass(c.status)}">${c.status}</span>
        </div>
      </div>
      <div class="complaint-desc">${escapeHtml(c.description)}</div>
      <div class="complaint-actions">
        <select class="btn-sm" style="width:auto;" data-id="${c.id}" onchange="updateStatus(${c.id}, this.value)">
          <option ${c.status==="Pending"?"selected":""}>Pending</option>
          <option ${c.status==="In Progress"?"selected":""}>In Progress</option>
          <option ${c.status==="Resolved"?"selected":""}>Resolved</option>
        </select>
        <button class="btn btn-sm btn-outline" onclick="addRemark(${c.id}, '${(c.remarks||"").replace(/'/g,"\\'")}')">Add remark</button>
        <button class="btn btn-sm btn-danger" onclick="deleteComplaint(${c.id})">Delete</button>
      </div>
      ${c.remarks ? `<div class="complaint-remarks">Remarks: ${escapeHtml(c.remarks)}</div>` : ""}
    </div>
  `).join("");
}

window.updateStatus = async (id, status) => {
  await api(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  renderAdminView();
};
window.addRemark = async (id, current) => {
  const remark = prompt("Add a remark for this complaint:", current || "");
  if (remark === null) return;
  await api(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify({ remarks: remark.trim() }) });
  renderAdminView();
};
window.deleteComplaint = async (id) => {
  if (!confirm("Delete this complaint permanently?")) return;
  await api(`/complaints/${id}`, { method: "DELETE" });
  renderAdminView();
};

["filterStatus","filterCategory","filterSearch"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderAdminView);
  document.getElementById(id).addEventListener("change", renderAdminView);
});

// ---- Resume session if already logged in ----
if (token && user) enterApp();
