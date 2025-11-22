// Admin portal logic
(() => {
  const loginSection = document.getElementById("loginSection");
  const loginForm = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const logoutBtn = document.getElementById("logoutBtn");

  

  const checklistSelect = document.getElementById("checklistSelect");
  const checklistForm = document.getElementById("checklistForm");
  const checklistNameInput = document.getElementById("checklistName");
  const checklistDescInput = document.getElementById("checklistDesc");
  const checklistCategoryInput = document.getElementById("checklistCategory");
  const deleteChecklistBtn = document.getElementById("deleteChecklistBtn");
  const createChecklistBtn = document.getElementById("createChecklistBtn");
  const saveChecklistBtn = document.getElementById("saveChecklistBtn");

  const credForm = document.getElementById("credForm");
  const credUsernameInput = document.getElementById("credUsername");
  const credPasswordInput = document.getElementById("credPassword");

  

  const subsList = document.getElementById("subsList");
  const subsEmpty = document.getElementById("subsEmpty");
  const gridRegsList = document.getElementById("gridRegsList");
  const gridRegsEmpty = document.getElementById("gridRegsEmpty");

  const emailList = document.getElementById("emailList");
  const emailEmpty = document.getElementById("emailEmpty");
  const emailSubject = document.getElementById("emailSubject");
  const emailBody = document.getElementById("emailBody");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const selectAllEmails = document.getElementById("selectAllEmails");

  let isAuthed = false;
  let currentChecklistId = "";

  function clsToBadge(label) {
    const l = String(label || "").toLowerCase();
    if (l.includes("exemplary")) return "badge-exemplary";
    if (l.includes("strong")) return "badge-strong";
    if (l.includes("develop")) return "badge-developing";
    if (l.includes("early")) return "badge-early";
    if (l.includes("needs") || l.includes("immediate")) return "badge-needs-improvement";
    return "";
  }


  function renderChecklists() {
    const lists = getChecklists();
    if (checklistSelect) {
      checklistSelect.innerHTML = "";
      lists.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        const base = `${c.code ? `[${c.code}] ` : ""}${c.name}`;
        opt.textContent = c.published ? base : `${base} (Draft)`;
        checklistSelect.appendChild(opt);
      });
      if (!lists.find(c => c.id === currentChecklistId)) {
        currentChecklistId = (lists[0]?.id) || "";
      }
      if (currentChecklistId) checklistSelect.value = currentChecklistId;
    }
    fillChecklistFormFromSelected();
  }

  function fillChecklistFormFromSelected() {
    const lists = getChecklists();
    const sel = lists.find(c => c.id === (checklistSelect?.value || currentChecklistId));
    if (!sel) {
      if (checklistNameInput) checklistNameInput.value = "";
      if (checklistDescInput) checklistDescInput.value = "";
      if (checklistCategoryInput) checklistCategoryInput.value = "";
      return;
    }
    if (checklistNameInput) checklistNameInput.value = sel.name || "";
    if (checklistDescInput) checklistDescInput.value = sel.description || "";
    if (checklistCategoryInput) {
      const cat = typeof sel.category === "string" ? sel.category : "";
      const optionValues = Array.from(checklistCategoryInput.options).map(o => o.value);
      checklistCategoryInput.value = optionValues.includes(cat) ? cat : "";
    }
  }

  

  function showPanel() {
    isAuthed = true;
    if (loginSection) loginSection.hidden = true;
    if (adminPanel) adminPanel.hidden = false;
    const creds = getAdminCreds();
    if (credUsernameInput) credUsernameInput.value = creds.username;
    if (credPasswordInput) credPasswordInput.value = creds.password;
    renderChecklists();
    renderSubmissions();
    renderGridRegistrations();
  }

  if (loginForm) loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const { username, password } = getAdminCreds();
    const u = document.getElementById("adminUsername").value.trim();
    const p = document.getElementById("adminPassword").value;
    if (u === username && p === password) {
      showPanel();
    } else {
      alert("Invalid credentials");
    }
  });

  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    isAuthed = false;
    if (adminPanel) adminPanel.hidden = true;
    if (loginSection) loginSection.hidden = false;
    try { loginForm && loginForm.reset(); } catch {}
  });

  

  credForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = credUsernameInput.value.trim();
    const p = credPasswordInput.value;
    if (!u || !p) return alert("Username and password required");
    saveAdminCreds(u, p);
    alert("Credentials updated");
  });

  

  function renderSubmissions() {
    const listEl = document.getElementById("subsList");
    const emptyEl = document.getElementById("subsEmpty");
    if (!listEl || !emptyEl) return;
    const subs = getAssessments();
    listEl.innerHTML = "";
    emptyEl.hidden = subs.length !== 0;
    subs.forEach(s => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const badge = clsToBadge(s.classification);
      left.innerHTML = `<div class="item-title">${s.email} • ${s.checklistName || s.checklistId || "General"}</div><div class="item-sub">QuXAT Self Assessment Score ${s.score} • Classification <span class="badge ${badge}">${s.classification || "-"}</span> (${s.scorePercent ?? 0}%) • ${s.status.toUpperCase()} • submitted ${new Date(s.submittedAt).toLocaleString()}</div>`;
      const actions = document.createElement("div");
      actions.className = "item-actions";

      const viewBtn = document.createElement("button");
      viewBtn.className = "btn";
      viewBtn.textContent = "View";
      viewBtn.onclick = () => {
        const lines = s.selectedMetrics.map(m => `- ${m.name}`).join("\n");
        const sug = Array.isArray(s.suggestions) && s.suggestions.length ? `\nSuggested Improvements:\n${s.suggestions.map(x => `- ${x}`).join("\n")}\n` : "";
        const extra = [
          s.orgName ? `Organization: ${s.orgName}` : null,
          s.orgType ? `Organization Type: ${s.orgType}` : null,
          s.repName ? `Representative Name: ${s.repName}` : null,
          s.repDesignation ? `Designation: ${s.repDesignation}` : null,
          s.userNote ? `User Note: ${s.userNote}` : null,
        ].filter(Boolean).join("\n");
        alert(`Email: ${s.email}\nQSAS: ${s.score}\nClassification: ${s.classification || "-"} (${s.scorePercent ?? 0}%)\nStatus: ${s.status}\nSubmitted: ${new Date(s.submittedAt).toLocaleString()}\nChecklist: ${s.checklistName || s.checklistId || "General"}\n${extra ? extra + "\n" : ""}${sug}\nMetrics:\n${lines}`);
      };

      const approveBtn = document.createElement("button");
      approveBtn.className = "btn btn-primary";
      approveBtn.textContent = "Approve";
      approveBtn.disabled = s.status === "approved";
      approveBtn.onclick = () => { updateAssessmentStatusById(s.id, "approved"); renderSubmissions(); };

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "btn btn-danger";
      rejectBtn.textContent = "Reject";
      rejectBtn.disabled = s.status === "rejected";
      rejectBtn.onclick = () => { updateAssessmentStatusById(s.id, "rejected"); renderSubmissions(); };

      actions.append(viewBtn, approveBtn, rejectBtn);
      li.append(left, actions);
      listEl.appendChild(li);
    });
  }

  function renderEmailTargets() {
    if (!emailList || !emailEmpty) return;
    let assessments = [];
    try { assessments = getAssessments() || []; } catch(e) { assessments = []; }
    const byEmail = new Map();
    assessments.forEach(a => {
      const key = String(a.email || '').trim();
      if (!key) return;
      const item = byEmail.get(key) || { email: key, org: a.orgName || '', type: a.orgType || '', count: 0, last: a.submittedAt || '' };
      item.count += 1; item.last = a.submittedAt || item.last; byEmail.set(key, item);
    });
    const rows = Array.from(byEmail.values()).sort((a,b) => String(a.email).localeCompare(String(b.email)));
    emailList.innerHTML = '';
    emailEmpty.hidden = rows.length !== 0;
    const selected = new Set();
    rows.forEach(r => {
      const li = document.createElement('li');
      const title = document.createElement('div'); title.className = 'item-title'; title.textContent = `${r.email}`;
      const sub = document.createElement('div'); sub.className = 'item-sub'; sub.textContent = `${r.org || '—'} • ${r.type || '—'} • submissions: ${r.count}`;
      const actions = document.createElement('div'); actions.className = 'item-actions';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.onchange = () => { if (cb.checked) selected.add(r.email); else selected.delete(r.email); };
      actions.appendChild(cb);
      li.append(title, actions, sub);
      emailList.appendChild(li);
    });
    if (selectAllEmails) {
      selectAllEmails.checked = false;
      selectAllEmails.onchange = () => {
        const boxes = emailList.querySelectorAll('input[type=checkbox]');
        boxes.forEach(b => { b.checked = selectAllEmails.checked; const e = b.closest('li')?.querySelector('.item-title')?.textContent || ''; if (selectAllEmails.checked) selected.add(e); else selected.delete(e); });
      };
    }
    if (sendEmailBtn) {
      sendEmailBtn.onclick = () => {
        const subject = (emailSubject?.value || '').trim();
        const body = (emailBody?.value || '').trim();
        const emails = Array.from(selected);
        if (!subject || !body) return alert('Subject and message are required');
        if (emails.length === 0) return alert('Select at least one organization');
        try {
          const payload = btoa(JSON.stringify({ emails, subject, body }));
          const topWin = window.top || window.parent || window;
          const base = topWin.location.origin;
          const url = base + '/?section=Admin&sync=email&payload=' + encodeURIComponent(payload);
          topWin.location.assign(url);
        } catch(e) { alert('Unable to send'); }
      };
    }
  }

  function renderGridRegistrations() {
    const host = document.getElementById("gridRegistrationsHost") || document.body;
    try {
      const res = localStorage.getItem('qsas_sync_result');
      if (res) {
        localStorage.removeItem('qsas_sync_result');
        if (res === 'ok') alert('GitHub sync OK'); else alert('Sync failed ' + res);
        const redir = localStorage.getItem('qsas_post_sync_redirect');
        if (redir) {
          localStorage.removeItem('qsas_post_sync_redirect');
          const topWin = window.top || window.parent || window;
          const base = topWin.location.origin;
          topWin.location.assign(base + '/?section=' + encodeURIComponent(redir));
        }
      }
    } catch(e) {}
    const listEl = document.getElementById("gridRegsList");
    const emptyEl = document.getElementById("gridRegsEmpty");
    if (!listEl || !emptyEl) return;
    const regs = getGridRegistrations();
    listEl.innerHTML = "";
    emptyEl.hidden = regs.length !== 0;
    regs.forEach(r => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const badge = clsToBadge(r.classification);
      left.innerHTML = `<div class="item-title">${r.orgName || "-"} • ${r.orgType || "-"}</div><div class="item-sub">Classification <span class="badge ${badge}">${r.classification || "-"}</span> • ${String(r.status || "pending").toUpperCase()} • submitted ${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</div>`;
      const actions = document.createElement("div");
      actions.className = "item-actions";

      const viewBtn = document.createElement("button");
      viewBtn.className = "btn";
      viewBtn.textContent = "View";
      viewBtn.onclick = () => {
        const overlay = document.createElement("div"); overlay.className = "modal-overlay";
        const card = document.createElement("div"); card.className = "modal-card";
        const title = document.createElement("div"); title.className = "modal-title"; title.textContent = `${r.orgName || "-"} • ${r.orgType || "-"}`;
        const sub = document.createElement("div"); sub.className = "modal-sub";
        const acc = Array.isArray(r.accreditations) && r.accreditations.length ? `Accreditations: ${r.accreditations.join(', ')}` : '';
        const locs = [r.orgCountry,r.orgState,r.orgDistrict,r.orgCity].filter(Boolean).join(', ');
        const idLine = r.regCode ? `ID: ${r.regCode}` : '';
        sub.textContent = [idLine, locs ? `Location: ${locs}` : '', r.email ? `Email: ${r.email}` : '', r.adminNote ? `Admin Note: ${r.adminNote}` : '', acc].filter(Boolean).join(' • ');
        const h = document.createElement("h3"); h.textContent = "Selected Guidelines";
        const ul = document.createElement("ul"); ul.className = "list";
        (Array.isArray(r.selectedMetrics) ? r.selectedMetrics : []).forEach(m => { const li = document.createElement("li"); li.textContent = `- ${m.name}`; ul.appendChild(li); });
        if (Array.isArray(r.suggestions) && r.suggestions.length) {
          const h2 = document.createElement("h3"); h2.textContent = "Suggested Improvements"; card.append(h2);
          const sugUl = document.createElement("ul"); sugUl.className = "list"; r.suggestions.forEach(s => { const li = document.createElement("li"); li.textContent = `- ${s}`; sugUl.appendChild(li); }); card.appendChild(sugUl);
        }
        const actions = document.createElement("div"); actions.className = "modal-actions";
        const close = document.createElement("button"); close.className = "btn"; close.textContent = "Close"; close.onclick = () => { document.body.removeChild(overlay); };
        actions.appendChild(close);
        card.append(title, sub, h, ul, actions); overlay.appendChild(card); document.body.appendChild(overlay);
      };

      const approveBtn = document.createElement("button");
      approveBtn.className = "btn btn-primary";
      approveBtn.textContent = "Approve";
      approveBtn.disabled = r.status === "approved";
      approveBtn.onclick = () => { updateGridRegistrationStatusById(r.id, "approved"); syncGridToGitHub(); const regs = getGridRegistrations() || []; const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-"); const name = "qsas_grid_registrations_backup_"+stamp+".json"; (function(o){ const blob = new Blob([JSON.stringify(o, null, 2)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 200); })(regs); };

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "btn btn-danger";
      rejectBtn.textContent = "Reject";
      rejectBtn.disabled = r.status === "rejected";
      rejectBtn.onclick = () => { updateGridRegistrationStatusById(r.id, "rejected"); syncGridToGitHub(); const regs = getGridRegistrations() || []; const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-"); const name = "qsas_grid_registrations_backup_"+stamp+".json"; (function(o){ const blob = new Blob([JSON.stringify(o, null, 2)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 200); })(regs); };

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => { if (confirm("Delete this registration?")) { deleteGridRegistrationById(r.id); syncGridToGitHub(); const regs = getGridRegistrations() || []; const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-"); const name = "qsas_grid_registrations_backup_"+stamp+".json"; (function(o){ const blob = new Blob([JSON.stringify(o, null, 2)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 200); })(regs); } };


      actions.append(viewBtn, approveBtn, rejectBtn, deleteBtn);
      li.append(left, actions);
      listEl.appendChild(li);
    });
  }

  // Refresh submissions list when window gains focus
  window.addEventListener("focus", () => { renderSubmissions(); });

  // Checklist selection controls
  checklistSelect?.addEventListener("change", () => {
    currentChecklistId = checklistSelect.value;
    fillChecklistFormFromSelected();
  });

  // Create new checklist as draft
  createChecklistBtn?.addEventListener("click", () => {
    const name = checklistNameInput.value.trim();
    const desc = checklistDescInput.value.trim();
    if (!name) return alert("Enter a checklist name.");
    const category = checklistCategoryInput ? checklistCategoryInput.value : "";
    const id = addChecklist(name, desc, category);
    currentChecklistId = id;
    renderChecklists();
  });

  // Save/publish current checklist (requires at least 1 metric)
  saveChecklistBtn?.addEventListener("click", () => {
    if (!currentChecklistId) return;
    const name = checklistNameInput.value.trim();
    const desc = checklistDescInput.value.trim();
    const category = checklistCategoryInput ? checklistCategoryInput.value : "";
    if (name) updateChecklist(currentChecklistId, name, desc, category);
    publishChecklist(currentChecklistId);
    renderChecklists();
    alert("Checklist saved and published.");
  });

  deleteChecklistBtn?.addEventListener("click", () => {
    if (!currentChecklistId) return;
    if (confirm("Delete the selected checklist and its metrics?")) {
      deleteChecklist(currentChecklistId);
      currentChecklistId = "";
      renderChecklists();
    }
  });

  // Initialize email targets
  try { renderEmailTargets(); } catch(e) {}
  
})();
  
    function syncGridToGitHub() {
      try {
        // Send only approved registrations to keep payload small and match public bootstrap usage
        const regs = (typeof getApprovedGridRegistrations === 'function') ? (getApprovedGridRegistrations() || []) : ((getGridRegistrations() || []).filter(r => r.status === 'approved'));
        const b64 = btoa(JSON.stringify(regs));
        if (b64.length > 60000) { alert('Sync payload too large; please reduce entries or contact support'); return; }
        const topWin = window.top || window.parent || window;
        const base = topWin.location.origin;
        const url = base + '/?section=Admin&sync=grid&payload=' + encodeURIComponent(b64);
        topWin.location.assign(url);
      } catch(e) { alert('Sync failed'); }
    }
