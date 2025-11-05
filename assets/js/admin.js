// Admin portal logic
(() => {
  const loginSection = document.getElementById("loginSection");
  const loginForm = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const logoutBtn = document.getElementById("logoutBtn");

  const metricForm = document.getElementById("metricForm");
  const metricIdInput = document.getElementById("metricId");
  const metricNameInput = document.getElementById("metricName");
  const metricPointsInput = document.getElementById("metricPoints");
  const resetFormBtn = document.getElementById("resetFormBtn");

  const checklistSelect = document.getElementById("checklistSelect");
  const checklistForm = document.getElementById("checklistForm");
  const checklistNameInput = document.getElementById("checklistName");
  const checklistDescInput = document.getElementById("checklistDesc");
  const deleteChecklistBtn = document.getElementById("deleteChecklistBtn");
  const createChecklistBtn = document.getElementById("createChecklistBtn");
  const saveChecklistBtn = document.getElementById("saveChecklistBtn");

  const credForm = document.getElementById("credForm");
  const credUsernameInput = document.getElementById("credUsername");
  const credPasswordInput = document.getElementById("credPassword");

  const metricsList = document.getElementById("metricsList");
  const metricsEmpty = document.getElementById("metricsEmpty");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const clearBtn = document.getElementById("clearBtn");
  const goToMetricsBtn = document.getElementById("goToMetricsBtn");

  const subsList = document.getElementById("subsList");
  const subsEmpty = document.getElementById("subsEmpty");

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

  async function loadImageDataURL(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function generateCertificateCode() {
    const prefix = "QUXATSCC"; // 8 chars
    const ts = Date.now();
    let tail = ts.toString(36).toUpperCase(); // alphanumeric
    if (tail.length < 8) tail = tail.padStart(8, "0");
    if (tail.length > 8) tail = tail.slice(-8);
    return prefix + tail; // total length 16
  }

  async function downloadVerifiedCertificate(s) {
    const jspdfNS = window.jspdf;
    if (!jspdfNS || !jspdfNS.jsPDF) {
      return alert("PDF library not loaded. Please ensure internet connectivity.");
    }
    // Generate and persist certificate code metadata
    const certCode = generateCertificateCode();
    const generatedAt = new Date().toISOString();
    try {
      const assessments = getAssessments();
      const idx = assessments.findIndex(a => a.id === s.id);
      if (idx !== -1) {
        assessments[idx].certificateCode = certCode;
        assessments[idx].certificateGeneratedAt = generatedAt;
        saveAssessments(assessments);
      }
    } catch (e) {
      console.warn("Failed to persist certificate metadata:", e);
    }
    const doc = new jspdfNS.jsPDF({ unit: "mm", format: "a4" });
    // Logo
    const logoSrc = document.getElementById("brandLogo")?.getAttribute("src") || "assets/QuXAT%20Logo%20Facebook.png";
    let logoDataURL = null;
    try { logoDataURL = await loadImageDataURL(logoSrc); } catch {}
    // Verified round seal image
    const sealSrc = "assets/QuXAT_Round_Seal.png";
    let sealDataURL = null;
    try { sealDataURL = await loadImageDataURL(sealSrc); } catch {}
    // Authorized signatory signature image
    const signSrc = "assets/Authorized%20Signatory.png";
    let signDataURL = null;
    try { signDataURL = await loadImageDataURL(signSrc); } catch {}
    // Decorative border
    doc.setDrawColor(225,231,245);
    doc.roundedRect(10, 10, 190, 277, 3, 3, "S");
    // Header
    if (logoDataURL) { doc.addImage(logoDataURL, "PNG", 15, 16, 24, 24); }
    doc.setFontSize(18); doc.text("QuXAT Self Assessment Certificate", 45, 22);
    doc.setFontSize(12); doc.setTextColor(0,128,0); doc.text("Verified and Approved Certificate", 45, 29);
    doc.setTextColor(0,0,0);
    // Body details
    let y = 42; const left = 15;
    const row = (label, value) => { doc.setTextColor(107,119,140); doc.text(label, left, y); doc.setTextColor(0,0,0); doc.text(String(value||"-"), left+60, y); y += 8; };
    row("Participant Email", s.email);
    row("Organization", s.orgName || "-");
    row("Representative Name", s.repName || "-");
    row("Designation", s.repDesignation || "-");
    if (s.userNote) { row("User Note", s.userNote); }
    row("Checklist", s.checklistName || s.checklistId || "-");
    row("Submitted At", s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "-");
    row("Verified At", s.verifiedAt ? new Date(s.verifiedAt).toLocaleString() : "-");
    row("Certificate Code", certCode);
    row("Certificate Generated", new Date(generatedAt).toLocaleString());
    row("QuXAT Self Assessment Score", s.score);
    row("Score Percent", `${s.scorePercent ?? 0}%`);
    row("Classification", s.classification || "-");
    if (s.adminNote) { row("Admin Note", s.adminNote); }
    y += 2;
    // Selected metrics
    doc.setFont(undefined, "bold"); doc.text("Selected Metrics", left, y); doc.setFont(undefined, "normal"); y += 7;
    (Array.isArray(s.selectedMetrics) ? s.selectedMetrics : []).forEach(m => {
      const split = doc.splitTextToSize(`• ${m.name} (+${m.points})`, 180);
      split.forEach(ln => { doc.text(ln, left, y); y += 6; if (y > 270) { doc.addPage(); y = 20; } });
    });
    y += 10;
    // Self-assessment basis statement
    doc.setTextColor(107,119,140);
    const stmt = "This certificate is based on the self assessment provided by the organization’s authorized representative.";
    const stmtLines = doc.splitTextToSize(stmt, 180);
    stmtLines.forEach(ln => { doc.text(ln, left, y); y += 6; if (y > 270) { doc.addPage(); y = 20; } });
    doc.setTextColor(0,0,0);
    // Authorized signatory block (only on verified certificates)
    doc.setFont(undefined, "bold"); doc.text("Authorization", left, y); doc.setFont(undefined, "normal"); y += 6;
    doc.text("Authorized Signatory:", left, y); y += 18;
    // Signature line
    doc.setDrawColor(180,180,180);
    doc.line(left + 50, y - 12, left + 120, y - 12);
    // Signature image overlay (if available)
    if (signDataURL) {
      // Fit signature image within the signature line area
      const sigX = left + 52;
      const sigY = y - 20; // slightly above line baseline
      const sigW = 60; // width in mm
      const sigH = 16; // height in mm
      doc.addImage(signDataURL, "PNG", sigX, sigY, sigW, sigH);
    }
    doc.setTextColor(107,119,140);
    doc.text("Signature", left + 82, y - 6);
    doc.setTextColor(0,0,0);
    // Stamp (round seal image)
    if (sealDataURL) {
      // Place the round seal to the right of signature area
      const sealX = 150;
      const sealY = y - 28; // sit above baseline
      const sealW = 28; // mm width
      const sealH = 28; // mm height
      doc.addImage(sealDataURL, "PNG", sealX, sealY, sealW, sealH);
    }
    // Save
    doc.save(`QuXAT-Verified-Certificate-${s.email}.pdf`);
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
  }

  function renderMetrics() {
    const metrics = getMetrics(currentChecklistId);
    metricsList.innerHTML = "";
    metricsEmpty.hidden = metrics.length !== 0;
    metrics.forEach((m, idx) => {
      const li = document.createElement("li");
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `S. No: ${idx + 1} • ${m.code ? `[${m.code}] ` : ""}${m.name}`;
      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.textContent = `${m.points} points`;
      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => {
        metricIdInput.value = m.id;
        metricNameInput.value = m.name;
        metricPointsInput.value = String(m.points);
        metricNameInput.focus();
      };

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (confirm("Delete this metric?")) {
          deleteMetric(currentChecklistId, m.id);
          renderMetrics();
        }
      };

      actions.append(editBtn, delBtn);
      li.append(title, sub, actions);
      metricsList.appendChild(li);
    });
  }

  function showPanel() {
    isAuthed = true;
    loginSection.hidden = true;
    adminPanel.hidden = false;
    const creds = getAdminCreds();
    credUsernameInput.value = creds.username;
    credPasswordInput.value = creds.password;
    renderChecklists();
    renderMetrics();
    renderSubmissions();
  }

  loginForm.addEventListener("submit", (e) => {
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

  logoutBtn.addEventListener("click", () => {
    isAuthed = false;
    adminPanel.hidden = true;
    loginSection.hidden = false;
    loginForm.reset();
  });

  metricForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentChecklistId) return alert("Create or select a checklist first.");
    const id = metricIdInput.value.trim();
    const name = metricNameInput.value.trim();
    const points = Number(metricPointsInput.value);
    if (!name || Number.isNaN(points)) return;
    if (id) {
      updateMetric(currentChecklistId, id, name, points);
    } else {
      addMetric(currentChecklistId, name, points);
    }
    metricForm.reset();
    metricIdInput.value = "";
    renderMetrics();
  });

  resetFormBtn.addEventListener("click", () => {
    metricForm.reset();
    metricIdInput.value = "";
  });

  credForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = credUsernameInput.value.trim();
    const p = credPasswordInput.value;
    if (!u || !p) return alert("Username and password required");
    saveAdminCreds(u, p);
    alert("Credentials updated");
  });

  exportBtn.addEventListener("click", () => {
    if (!currentChecklistId) return alert("Select a checklist to export metrics.");
    const metrics = getMetrics(currentChecklistId);
    const json = JSON.stringify({ checklistId: currentChecklistId, metrics }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qsas-metrics-${currentChecklistId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentChecklistId) { importInput.value = ""; return alert("Select a checklist before importing metrics."); }
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data.metrics) ? data.metrics : Array.isArray(data) ? data : [];
      saveMetrics(currentChecklistId, list);
      renderMetrics();
      alert("Metrics imported");
    } catch {
      alert("Invalid JSON format");
    }
    importInput.value = "";
  });

  clearBtn.addEventListener("click", () => {
    if (!currentChecklistId) return alert("Select a checklist before clearing metrics.");
    if (confirm("Clear all metrics?")) {
      saveMetrics(currentChecklistId, []);
      renderMetrics();
    }
  });

  function renderSubmissions() {
    const subs = getAssessments();
    subsList.innerHTML = "";
    subsEmpty.hidden = subs.length !== 0;
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
        const lines = s.selectedMetrics.map(m => `- ${m.name} (+${m.points})`).join("\n");
        const sug = Array.isArray(s.suggestions) && s.suggestions.length ? `\nSuggested Improvements:\n${s.suggestions.map(x => `- ${x}`).join("\n")}\n` : "";
        const extra = [
          s.orgName ? `Organization: ${s.orgName}` : null,
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

      const certBtn = document.createElement("button");
      certBtn.className = "btn";
      certBtn.textContent = "Download Verified Certificate";
      certBtn.disabled = s.status !== "approved";
      certBtn.onclick = () => {
        if (s.status !== "approved") return alert("Please approve the assessment before downloading a verified certificate.");
        downloadVerifiedCertificate(s);
      };

      actions.append(viewBtn, approveBtn, rejectBtn, certBtn);
      li.append(left, actions);
      subsList.appendChild(li);
    });
  }

  // Refresh submissions list when window gains focus
  window.addEventListener("focus", renderSubmissions);

  // Checklist selection controls
  checklistSelect?.addEventListener("change", () => {
    currentChecklistId = checklistSelect.value;
    renderMetrics();
  });

  // Create new checklist as draft
  createChecklistBtn?.addEventListener("click", () => {
    const name = checklistNameInput.value.trim();
    const desc = checklistDescInput.value.trim();
    if (!name) return alert("Enter a checklist name.");
    const id = addChecklist(name, desc);
    currentChecklistId = id;
    renderChecklists();
    renderMetrics();
    metricForm?.scrollIntoView({ behavior: "smooth", block: "start" });
    metricNameInput?.focus();
  });

  // Save/publish current checklist (requires at least 1 metric)
  saveChecklistBtn?.addEventListener("click", () => {
    if (!currentChecklistId) return;
    const name = checklistNameInput.value.trim();
    const desc = checklistDescInput.value.trim();
    if (name) updateChecklist(currentChecklistId, name, desc);
    const count = getMetrics(currentChecklistId).length;
    if (count === 0) return alert("Add at least one metric before saving.");
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
      renderMetrics();
    }
  });
  // Jump to metrics form for the selected checklist
  goToMetricsBtn?.addEventListener("click", () => {
    currentChecklistId = checklistSelect?.value || currentChecklistId || "";
    renderMetrics();
    metricForm?.scrollIntoView({ behavior: "smooth", block: "start" });
    metricNameInput?.focus();
  });
})();