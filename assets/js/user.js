// User self-assessment logic
(() => {
  const listEl = document.getElementById("userMetrics");
  const emptyEl = document.getElementById("userEmpty");
  const gateMsgEl = document.getElementById("gateMsg");
  const selectedHeaderEl = document.getElementById("selectedChecklistHeader");
  const selectedTitleEl = document.getElementById("selectedChecklistTitle");
  const selectedDescEl = document.getElementById("selectedChecklistDesc");
  const selectedHeaderStartEl = document.getElementById("selectedChecklistHeaderStart");
  const selectedTitleStartEl = document.getElementById("selectedChecklistTitleStart");
  const selectedDescStartEl = document.getElementById("selectedChecklistDescStart");
  const mediaEl = document.getElementById("selectedChecklistMedia");
  const mediaStartEl = document.getElementById("selectedChecklistMediaStart");
  const actionsEl = document.getElementById("selectedChecklistActions");
  const actionsStartEl = document.getElementById("selectedChecklistActionsStart");
  const copyShareLinkBtn = document.getElementById("copyShareLink");
  const copyShortLinkBtn = document.getElementById("copyShortLink");
  const copyShareLinkStartBtn = document.getElementById("copyShareLinkStart");
  const copyShortLinkStartBtn = document.getElementById("copyShortLinkStart");
  const scoreEl = document.getElementById("scoreValue");
  const countEl = document.getElementById("selectedCount");
  const resetBtn = document.getElementById("resetSelectionBtn");
  const copyBtn = document.getElementById("copySummaryBtn");
  const startForm = document.getElementById("startForm");
  const userEmailInput = document.getElementById("userEmail");
  const orgNameInput = document.getElementById("orgName");
  const orgTypeInput = document.getElementById("orgType");
  const orgCategoryInput = document.getElementById("orgCategory");
  const orgDetailsSummaryEl = document.getElementById("orgDetailsSummary");
  const orgNameLabelEl = document.getElementById("orgNameLabel");
  const repNameLabelEl = document.getElementById("repNameLabel");
  const repDesignationLabelEl = document.getElementById("repDesignationLabel");
  const industryTableMount = document.getElementById("industryTable");
  const repNameInput = document.getElementById("repName");
  const repDesignationInput = document.getElementById("repDesignation");
  const userNoteInput = document.getElementById("userNote");
  const checklistChooser = document.getElementById("checklistChooser");
  const checklistsForUser = document.getElementById("checklistsForUser");
  const prevPanel = document.getElementById("prevAssessmentPanel");
  const prevSummaryEl = document.getElementById("prevAssessmentSummary");
  const continuePrevBtn = document.getElementById("continuePrevBtn");
  const startNewBtn = document.getElementById("startNewBtn");
  const submitVerificationBtn = document.getElementById("submitVerificationBtn");
  const downloadUnverifiedBtn = document.getElementById("downloadUnverifiedBtn");
  const downloadVerifiedBtn = document.getElementById("downloadVerifiedBtn");
  const scoreRowEl = document.querySelector(".score-row");
  const suggestionsEl = document.createElement("div");
  suggestionsEl.id = "suggestionsBox";
  suggestionsEl.className = "card info";
  suggestionsEl.hidden = true;
  scoreRowEl?.parentElement?.appendChild(suggestionsEl);

  // Certificate elements
  const certEl = document.getElementById("qualityCard");
  const certEmailEl = document.getElementById("certEmail");
  const certChecklistEl = document.getElementById("certChecklist");
  const certDateEl = document.getElementById("certDate");
  const certScoreEl = document.getElementById("certScore");
  const certPercentEl = document.getElementById("certPercent");
  const certClassEl = document.getElementById("certClass");
  const certChecklistDescEl = document.getElementById("certChecklistDesc");
  const certSelectedCountEl = document.getElementById("certSelectedCount");
  const certStatusEl = document.getElementById("certStatus");
  const certOrgEl = document.getElementById("certOrg");
  const certOrgTypeEl = document.getElementById("certOrgType");
  const downloadCertBtn = document.getElementById("downloadCertificateBtn");
  const printCertBtn = document.getElementById("printCertificateBtn");

  let lastScore = 0;
  let lastPercent = 0;

  let selections = new Set();
  let currentEmail = "";
  let awaitingChoice = false;
  let currentChecklistId = "";
  let currentOrgName = "";
  let currentOrgType = "";
  let currentCategory = localStorage.getItem("qsas_last_user_category") || "";
  // Limit to 10 metrics per checklist and normalize total score to 100
  const METRIC_LIMIT = 10;

  // Bootstrap deep-linking: preselect checklist/category if provided via localStorage
  (function(){
    try {
      const bootCat = localStorage.getItem('qsas_boot_category') || '';
      const bootChk = localStorage.getItem('qsas_boot_checklist') || '';
      if (bootCat) {
        currentCategory = String(bootCat);
        try { localStorage.setItem('qsas_last_user_category', currentCategory); } catch {}
      }
      if (bootChk) {
        currentChecklistId = String(bootChk);
      }
      // Clear one-shot boot keys so repeated visits don't force selection
      try { localStorage.removeItem('qsas_boot_category'); } catch {}
      try { localStorage.removeItem('qsas_boot_checklist'); } catch {}
    } catch(e) {}
  })();

  // Also parse query params when loaded directly as a static page (no Streamlit)
  (function(){
    try {
      const sp = new URLSearchParams(window.location.search);
      const qCat = sp.get('category');
      const qChk = sp.get('checklist');
      const short = sp.get('s');
      if (short) {
        try {
          const b64 = String(short).replace(/-/g,'+').replace(/_/g,'/');
          const json = JSON.parse(atob(b64));
          if (json && typeof json === 'object') {
            if (json.category) currentCategory = String(json.category);
            if (json.checklist) currentChecklistId = String(json.checklist);
            try { localStorage.setItem('qsas_last_user_category', currentCategory); } catch {}
          }
        } catch(e) {}
      }
      if (qCat) {
        currentCategory = String(qCat);
        try { localStorage.setItem('qsas_last_user_category', currentCategory); } catch {}
      }
      if (qChk) {
        currentChecklistId = String(qChk);
      }
    } catch(e) {}
  })();

  function limitedMetrics(id) {
    const all = id ? (getMetrics(id) || []) : [];
    return all.slice(0, Math.min(METRIC_LIMIT, all.length));
  }
  function perMetricPoints(metrics) {
    const count = Math.min(METRIC_LIMIT, metrics.length || METRIC_LIMIT);
    return count ? (100 / count) : 0;
  }
  let currentRepName = "";
  let currentRepDesignation = "";
  let currentUserNote = "";

  function updateActionButtonsVisibility() {
    try {
      const prev = currentEmail ? getAssessmentByEmail(currentEmail, currentChecklistId || null) : null;
      const approved = !!(prev && prev.status === "approved");
      if (downloadVerifiedBtn) downloadVerifiedBtn.hidden = !approved;
      if (downloadCertBtn) downloadCertBtn.hidden = !approved;
      if (printCertBtn) printCertBtn.hidden = !approved;
    } catch (e) {}
  }

  function clsToBadge(label) {
    const l = String(label || "").toLowerCase();
    if (l.includes("exemplary")) return "badge-exemplary";
    if (l.includes("strong")) return "badge-strong";
    if (l.includes("develop")) return "badge-developing";
    if (l.includes("early")) return "badge-early";
    if (l.includes("needs") || l.includes("immediate")) return "badge-needs-improvement";
    return "";
  }

  // Category and cascading Organization Type helpers
  const DEFAULT_CATEGORIES = [
    "Hospitals & Healthcare",
    "Schools",
    "Colleges & Universities",
    "Industrial & Manufacturing",
    "Offices & Corporate",
    "Public & Community Organizations",
  ];

  // Light pastel color per category for visual differentiation
  function categoryColor(cat) {
    const palette = [
      '#FFF7ED', // orange-50
      '#F0FDF4', // green-50
      '#F0F9FF', // sky-50
      '#FDF2F8', // pink-50
      '#F5F3FF', // violet-50
      '#EEF2FF', // indigo-50
      '#FEF2F2', // red-50
      '#ECFDF5', // emerald-50
      '#FFFBEB', // amber-50
      '#F1F5F9'  // slate-100
    ];
    if (!cat) return '#F1F5F9';
    let h = 0;
    const s = String(cat);
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return palette[Math.abs(h) % palette.length];
  }

  const ORG_TYPES_BY_CATEGORY = {
    "Hospitals & Healthcare": [
      "Hospitals & Healthcare",
      "Clinics & Primary Care",
      "Nursing Homes & Long-Term Care",
      "Diagnostic Labs & Imaging Centers",
      "Pharmacies",
    ],
    "Schools": [
      "Schools",
      "Training Institutes",
    ],
    "Colleges & Universities": [
      "Colleges & Universities",
      "Training Institutes",
    ],
    "Industrial & Manufacturing": [
      "Industrial & Manufacturing",
      "Food & Hospitality",
      "Retail & E-commerce",
      "Logistics & Warehousing",
    ],
    "Offices & Corporate": [
      "Offices & Corporate",
      "IT & Software",
    ],
    "Public & Community Organizations": [
      "Public & Community Organizations",
      "Government Departments",
      "NGOs & Nonprofits",
    ],
  };

  function normalizeCategoryLabel(label) {
    const s = String(label || "").trim();
    const map = {
      "hospital/healthcare": "Hospitals & Healthcare",
      "hospitals & healthcare": "Hospitals & Healthcare",
      "schools": "Schools",
      "colleges & universities": "Colleges & Universities",
      "industrial & manufacturing": "Industrial & Manufacturing",
      "offices & corporate": "Offices & Corporate",
      "public & community organizations": "Public & Community Organizations",
    };
    const key = s.toLowerCase();
    return map[key] || s || "";
  }

  function deriveCategory(raw) {
    return normalizeCategoryLabel(raw);
  }

  function populateOrgTypesForCategory(cat) {
    if (!orgTypeInput) return;
    const opts = (ORG_TYPES_BY_CATEGORY[cat] || []);
    const all = [...opts, "Other"];
    orgTypeInput.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = ""; placeholder.textContent = "Select organization type";
    orgTypeInput.appendChild(placeholder);
    all.forEach(t => { const o = document.createElement("option"); o.textContent = t; o.value = t; orgTypeInput.appendChild(o); });
    // Clear prior selection if it no longer belongs to the chosen category
    if (!opts.includes(orgTypeInput.value)) orgTypeInput.value = "";
  }

  // Initialize category selection on load; if input not present, don't filter by category
  if (!orgCategoryInput) {
    currentCategory = "";
  } else {
    try { orgCategoryInput.value = currentCategory; } catch {}
    populateOrgTypesForCategory(currentCategory);
    orgCategoryInput.addEventListener("change", () => {
      currentCategory = orgCategoryInput.value || "";
      try { localStorage.setItem("qsas_last_user_category", currentCategory); } catch {}
      populateOrgTypesForCategory(currentCategory);
      // Refresh checklist chooser if visible
      if (currentEmail && !awaitingChoice && !currentChecklistId) renderChecklistButtons();
    });
  }

  // Render Industry Categories → Eligible Organizations table
  function renderIndustryInfoTable() {
    if (!industryTableMount) return;
    const lists = getChecklists().filter(c => c.published !== false);
    const catSet = new Set(lists.map(c => deriveCategory(c.category)).filter(Boolean));
    const categories = catSet.size ? Array.from(catSet).sort() : DEFAULT_CATEGORIES;

    const table = document.createElement("table");
    table.className = "table";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    const thCat = document.createElement("th"); thCat.textContent = "Category";
    const thOrg = document.createElement("th"); thOrg.textContent = "Eligible Organizations";
    trh.append(thCat, thOrg); thead.appendChild(trh);
    const tbody = document.createElement("tbody");
    categories.forEach(cat => {
      const tr = document.createElement("tr");
      tr.style.background = categoryColor(cat);
      const tdCat = document.createElement("td"); tdCat.textContent = cat;
      const tdOrg = document.createElement("td");
      const orgs = ORG_TYPES_BY_CATEGORY[cat] || [];
      tdOrg.textContent = orgs.length ? orgs.join(", ") : "—";
      tr.append(tdCat, tdOrg);
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);
    industryTableMount.innerHTML = "";
    industryTableMount.appendChild(table);
  }

  // Build table on load
  try { renderIndustryInfoTable(); } catch {}

  function render() {
    const metrics = currentChecklistId ? limitedMetrics(currentChecklistId) : [];
    listEl.innerHTML = "";
    emptyEl.hidden = metrics.length !== 0;
    gateMsgEl.hidden = !!currentEmail;
    listEl.hidden = !currentEmail || awaitingChoice || !currentChecklistId;
    checklistChooser.hidden = !(currentEmail && !awaitingChoice && !currentChecklistId);
    // Update selected checklist header
    try {
      const lists = getChecklists();
      const cl = lists.find(c => c.id === currentChecklistId);
      const showHeader = !!(currentChecklistId && cl);
      selectedHeaderEl && (selectedHeaderEl.hidden = !showHeader);
      if (showHeader) {
        selectedTitleEl && (selectedTitleEl.textContent = `${cl.code ? '[' + cl.code + '] ' : ''}${cl.name}`);
        selectedDescEl && (selectedDescEl.textContent = cl.description || "");
        setHeaderMedia(mediaEl, cl.name);
        if (actionsEl) { actionsEl.style.display = 'flex'; }
      }
      // Also show header at the start form section
      selectedHeaderStartEl && (selectedHeaderStartEl.hidden = !showHeader);
      if (showHeader) {
        selectedTitleStartEl && (selectedTitleStartEl.textContent = `${cl.code ? '[' + cl.code + '] ' : ''}${cl.name}`);
        selectedDescStartEl && (selectedDescStartEl.textContent = cl.description || "");
        setHeaderMedia(mediaStartEl, cl.name);
        if (actionsStartEl) { actionsStartEl.style.display = 'flex'; }
        wireShareButtons();
      }
    } catch(e) {}
    if (!currentChecklistId && currentEmail && !awaitingChoice) renderChecklistButtons();
    metrics.forEach((m, idx) => {
      const li = document.createElement("li");
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `S. No: ${idx + 1} • ${m.code ? `[${m.code}] ` : ""}${m.name}`;

      const controls = document.createElement("div");
      controls.className = "item-actions";
      const yes = document.createElement("input");
      yes.type = "radio";
      yes.name = `answer-${m.id}`;
      yes.id = `yes-${m.id}`;
      yes.checked = selections.has(m.id);
      yes.onchange = () => { if (yes.checked) { selections.add(m.id); updateScore(); } };
      const yesLbl = document.createElement("label");
      yesLbl.textContent = "Yes";
      yesLbl.htmlFor = yes.id;
      yesLbl.style.marginRight = "12px";
      const no = document.createElement("input");
      no.type = "radio";
      no.name = `answer-${m.id}`;
      no.id = `no-${m.id}`;
      no.checked = !selections.has(m.id);
      no.onchange = () => { if (no.checked) { selections.delete(m.id); updateScore(); } };
      const noLbl = document.createElement("label");
      noLbl.textContent = "No";
      noLbl.htmlFor = no.id;
      controls.append(yes, yesLbl, no, noLbl);

      const pts = document.createElement("div");
      pts.className = "item-sub";
      const pm = perMetricPoints(metrics);
      pts.textContent = `Code: ${m.code || "N/A"} • Yes = ${Math.round(pm)} pts`;

      li.append(title, controls, pts);
      listEl.appendChild(li);
    });
    updateScore();
    updateActionButtonsVisibility();
    // Customize organization detail labels/placeholders based on category
    try {
      const cat = deriveCategory(currentCategory);
      let nameLabel = 'Organization Name';
      let namePlaceholder = 'Your organization';
      let summaryText = 'Enter Organization Details';
      if (cat === 'Schools') {
        nameLabel = 'Name of the School';
        namePlaceholder = 'Your school';
        summaryText = 'Enter School Details';
      } else if (cat === 'Colleges & Universities') {
        nameLabel = 'Name of the College/University';
        namePlaceholder = 'Your college or university';
        summaryText = 'Enter College/University Details';
      } else if (cat === 'Hospitals & Healthcare') {
        nameLabel = 'Name of the Hospital / Healthcare Organization';
        namePlaceholder = 'Your hospital or healthcare organization';
        summaryText = 'Enter Hospital/Healthcare Organization Details';
      } else if (cat === 'Industrial & Manufacturing') {
        nameLabel = 'Name of the Company / Plant';
        namePlaceholder = 'Your company or plant';
        summaryText = 'Enter Industrial/Manufacturing Details';
      } else if (cat === 'Offices & Corporate') {
        nameLabel = 'Name of the Office / Company';
        namePlaceholder = 'Your office or company';
        summaryText = 'Enter Office/Corporate Details';
      } else if (cat === 'Public & Community Organizations') {
        nameLabel = 'Name of the Organization / Department';
        namePlaceholder = 'Your organization or department';
        summaryText = 'Enter Organization/Department Details';
      }
      if (orgNameLabelEl) orgNameLabelEl.childNodes[0].nodeValue = nameLabel + '\n';
      if (orgNameInput) orgNameInput.placeholder = namePlaceholder;
      if (orgDetailsSummaryEl) orgDetailsSummaryEl.textContent = summaryText;
      // Representative fields can remain generic but ensure present
      if (repNameLabelEl) repNameLabelEl.childNodes[0].nodeValue = 'Representative Name' + '\n';
      if (repDesignationLabelEl) repDesignationLabelEl.childNodes[0].nodeValue = 'Representative Designation' + '\n';
    } catch(e) {}
  }

  function updateScore() {
    const metrics = currentChecklistId ? limitedMetrics(currentChecklistId) : [];
    const selected = metrics.filter(m => selections.has(m.id));
    const pm = perMetricPoints(metrics);
    const score = Math.round(selected.length * pm);
    if (scoreEl) scoreEl.textContent = String(score);
    if (countEl) countEl.textContent = String(selected.length);
    // Classification & suggestions
    const total = 100;
    const cls = classifyScore(score, total, { metrics, selectedIds: Array.from(selections) });
    const show = !!currentEmail && !!currentChecklistId && metrics.length > 0;
    suggestionsEl.hidden = !show;
    if (certEl) certEl.hidden = !show;
    if (show) {
      const list = (cls.suggestions || []).map(s => `<li>${s}</li>`).join("");
      suggestionsEl.innerHTML = `<h3>Suggested Improvements</h3><ul class="list">${list}</ul>`;
      // Certificate population
      // Animations on change
      if (score !== lastScore && certScoreEl) {
        certScoreEl.textContent = String(score);
        certScoreEl.parentElement?.classList.add("animate");
        setTimeout(() => certScoreEl.parentElement?.classList.remove("animate"), 350);
        lastScore = score;
      } else {
        certScoreEl && (certScoreEl.textContent = String(score));
      }
      if (cls.percent !== lastPercent && certPercentEl) {
        certPercentEl.textContent = String(cls.percent);
        lastPercent = cls.percent;
      } else {
        certPercentEl && (certPercentEl.textContent = String(cls.percent));
      }
      certEmailEl && (certEmailEl.textContent = currentEmail);
      const missing = "Details Not Provided by Self - Assessment User";
      certOrgEl && (certOrgEl.textContent = currentOrgName || missing);
      certOrgTypeEl && (certOrgTypeEl.textContent = currentOrgType || missing);
      const lists = getChecklists();
      const cl = lists.find(c => c.id === currentChecklistId);
      certChecklistEl && (certChecklistEl.textContent = cl ? (cl.code ? `[${cl.code}] ` : "") + cl.name : "—");
      certChecklistDescEl && (certChecklistDescEl.textContent = cl ? (cl.description || "—") : "—");
      certDateEl && (certDateEl.textContent = new Date().toLocaleString());
      certSelectedCountEl && (certSelectedCountEl.textContent = String(selected.length));
      const prev = getAssessmentByEmail(currentEmail, currentChecklistId);
      certStatusEl && (certStatusEl.textContent = prev ? String(prev.status || "pending") : "Not submitted");
      updateActionButtonsVisibility();
      if (certClassEl) {
        certClassEl.textContent = cls.label || "—";
        const b = clsToBadge(cls.label);
        certClassEl.className = `badge ${b}`;
        certClassEl.classList.add("flash");
        setTimeout(() => certClassEl.classList.remove("flash"), 800);
      }
    }
  }

  resetBtn.addEventListener("click", () => {
    selections.clear();
    render();
  });

  copyBtn?.addEventListener("click", async () => {
    const metrics = currentChecklistId ? limitedMetrics(currentChecklistId) : [];
    const selected = metrics.filter(m => selections.has(m.id));
    const pm = perMetricPoints(metrics);
    const score = Math.round(selected.length * pm);
    const total = 100;
    const cls = classifyScore(score, total, { metrics, selectedIds: Array.from(selections) });
    const lines = [
      `QuXAT Self Assessment Score: ${score}`,
      `Classification: ${cls.label} (${cls.percent}%)`,
      `Selected metrics (${selected.length}):`,
      ...selected.map(m => `- ${m.code ? `[${m.code}] ` : ""}${m.name} (+${Math.round(pm)})`) 
    ].join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      alert("Summary copied to clipboard");
    } catch {
      alert("Unable to copy to clipboard");
    }
  });

  startForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = userEmailInput.value.trim();
    if (!email || !email.includes("@")) return alert("Please enter a valid email ID.");
    currentEmail = email;
    currentOrgName = (orgNameInput?.value || "").trim();
    currentOrgType = (orgTypeInput?.value || "").trim();
    currentRepName = (repNameInput?.value || "").trim();
    currentRepDesignation = (repDesignationInput?.value || "").trim();
    currentUserNote = (userNoteInput?.value || "").trim();
    // Do NOT clear currentChecklistId — if the user arrived via deep link or chose a checklist,
    // immediately allow assessment without re-selecting.
    const prev = currentChecklistId ? getAssessmentByEmail(email, currentChecklistId) : getAssessmentByEmail(email);
    if (prev && !currentChecklistId) {
      awaitingChoice = true;
      const submittedAt = prev.submittedAt ? new Date(prev.submittedAt).toLocaleString() : "-";
      const verifiedAt = prev.verifiedAt ? new Date(prev.verifiedAt).toLocaleString() : "-";
      const selectedCount = Array.isArray(prev.selectedMetrics) ? prev.selectedMetrics.length : 0;
      const statusLabel = String(prev.status || "pending").toUpperCase();
      prevSummaryEl.textContent = `Email: ${prev.email} • QSAS ${prev.score} • ${statusLabel} • ${selectedCount} metrics • submitted ${submittedAt}${prev.verifiedAt ? ` • verified ${verifiedAt}` : ""}`;
      prevPanel.hidden = false;
      render();
    } else {
      awaitingChoice = false;
      prevPanel.hidden = true;
      render();
    }
    updateActionButtonsVisibility();
    // Smooth scroll to next step
    const jumpTo = (currentChecklistId)
      ? document.getElementById("userMetrics")
      : (!awaitingChoice ? document.getElementById("checklistChooser") : document.getElementById("prevAssessmentPanel"));
    try { jumpTo && jumpTo.scrollIntoView({ behavior: "smooth", block: "start" }); } catch(e) {}
  });

  function renderChecklistButtons() {
    let lists = getChecklists().filter(c => c.published !== false);
    if (currentCategory) {
      lists = lists.filter(c => {
        const cat = deriveCategory(c.category);
        return String(cat || "").trim() === currentCategory;
      });
    }
    checklistsForUser.innerHTML = "";
    // Build table grouped by industry/category
    const table = document.createElement("table");
    table.className = "qsas-table";
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    const thCat = document.createElement("th"); thCat.textContent = "Category"; thCat.style.textAlign = "left"; thCat.style.padding = "8px"; thCat.style.borderBottom = "1px solid #e5e7eb";
    const thName = document.createElement("th"); thName.textContent = "Checklist"; thName.style.textAlign = "left"; thName.style.padding = "8px"; thName.style.borderBottom = "1px solid #e5e7eb";
    const thDesc = document.createElement("th"); thDesc.textContent = "Description"; thDesc.style.textAlign = "left"; thDesc.style.padding = "8px"; thDesc.style.borderBottom = "1px solid #e5e7eb";
    const thCount = document.createElement("th"); thCount.textContent = "Metrics"; thCount.style.textAlign = "left"; thCount.style.padding = "8px"; thCount.style.borderBottom = "1px solid #e5e7eb";
    const thAct = document.createElement("th"); thAct.textContent = "Action"; thAct.style.textAlign = "left"; thAct.style.padding = "8px"; thAct.style.borderBottom = "1px solid #e5e7eb";
    trh.append(thCat, thName, thDesc, thCount, thAct); thead.appendChild(trh);
    const tbody = document.createElement("tbody");
    // Group
    const categories = Array.from(new Set(lists.map(c => deriveCategory(c.category) || "Uncategorized"))).sort((a,b)=>a.localeCompare(b));
    const byCat = new Map(); categories.forEach(cat => byCat.set(cat, []));
    lists.forEach(c => { const cat = deriveCategory(c.category) || "Uncategorized"; byCat.get(cat)?.push(c); });
    categories.forEach(cat => {
      const items = (byCat.get(cat) || []).sort((a,b) => String(a.name).localeCompare(String(b.name)));
      if (items.length === 0) {
        const tr = document.createElement("tr");
        tr.style.background = categoryColor(cat);
        const tdCat = document.createElement("td"); tdCat.textContent = cat; tdCat.style.padding = "8px";
        const tdEmpty = document.createElement("td"); tdEmpty.colSpan = 4; tdEmpty.textContent = "No checklists published for this category yet."; tdEmpty.className = "hint"; tdEmpty.style.padding = "8px";
        tr.append(tdCat, tdEmpty); tbody.appendChild(tr);
        return;
      }
      items.forEach((c, idx) => {
        const tr = document.createElement("tr"); tr.style.borderTop = "1px solid #eef1f6";
        tr.style.background = categoryColor(cat);
        const tdCat = document.createElement("td"); tdCat.textContent = idx === 0 ? cat : ""; tdCat.style.padding = "8px"; tdCat.style.fontWeight = idx === 0 ? "600" : "normal";
        const tdName = document.createElement("td"); tdName.style.padding = "8px"; tdName.textContent = `${c.code ? '[' + c.code + '] ' : ''}${c.name}`;
        const tdDesc = document.createElement("td"); tdDesc.style.padding = "8px"; tdDesc.textContent = c.description || "";
        const tdCount = document.createElement("td"); tdCount.style.padding = "8px"; try { tdCount.textContent = String(Math.min((getMetrics(c.id) || []).length, METRIC_LIMIT)); } catch(e) { tdCount.textContent = '—'; }
        const tdAct = document.createElement("td"); tdAct.style.padding = "8px";
        const start = document.createElement("button"); start.className = "btn btn-primary"; start.textContent = "Start";
        start.onclick = () => {
          currentChecklistId = c.id;
          render();
          const target = document.getElementById("userMetrics");
          try { target && target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch(e) {}
        };
        tdAct.appendChild(start);
        tr.append(tdCat, tdName, tdDesc, tdCount, tdAct); tbody.appendChild(tr);
      });
    });
    table.append(thead, tbody);
    checklistsForUser.appendChild(table);
  }

  continuePrevBtn?.addEventListener("click", () => {
    const prev = getAssessmentByEmail(currentEmail);
    if (!prev) {
      awaitingChoice = false;
      prevPanel.hidden = true;
      return render();
    }
    selections = new Set((prev.selectedMetrics || []).map(m => m.id));
    currentChecklistId = prev.checklistId || "";
    awaitingChoice = false;
    prevPanel.hidden = true;
    render();
    updateActionButtonsVisibility();
  });

  startNewBtn?.addEventListener("click", () => {
    selections.clear();
    awaitingChoice = false;
    prevPanel.hidden = true;
    currentChecklistId = "";
    render();
    updateActionButtonsVisibility();
  });

  // Print certificate
  printCertBtn?.addEventListener("click", () => {
    try {
      if (certEl?.hidden) {
        // If the certificate is hidden but the assessment has been approved, load it for printing
        const prev = currentEmail ? getAssessmentByEmail(currentEmail, currentChecklistId || null) : null;
        let approvedAssessment = prev && prev.status === "approved" ? prev : null;
        if (!approvedAssessment && currentEmail) {
          const arr = getAssessmentsByEmail(currentEmail).filter(a => a.status === "approved");
          approvedAssessment = arr.sort((a,b) => new Date(b.verifiedAt||0) - new Date(a.verifiedAt||0))[0] || null;
        }
        if (approvedAssessment) {
          // Populate state from the approved assessment so the certificate card renders
          currentChecklistId = approvedAssessment.checklistId || currentChecklistId || "";
          try { selections = new Set((approvedAssessment.selectedMetrics || []).map(m => m.id)); } catch {}
          awaitingChoice = false;
          render();
          updateActionButtonsVisibility();
          if (certEl) certEl.hidden = false;
        }
      }
    } catch(e) {}
    window.print();
  });

  // Helper to load image as data URL
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
    const prefix = "QUXATSCC"; // 8 characters
    const ts = Date.now();
    let tail = ts.toString(36).toUpperCase();
    if (tail.length < 8) tail = tail.padStart(8, "0");
    if (tail.length > 8) tail = tail.slice(-8);
    return prefix + tail; // total 16 characters
  }

  // Download certificate PDF
  downloadCertBtn?.addEventListener("click", async () => {
    if (!currentEmail) return alert("Please enter your email and start the assessment.");
    if (!currentChecklistId) return alert("Please choose a checklist to continue.");
    const jspdfNS = window.jspdf;
    if (!jspdfNS || !jspdfNS.jsPDF) {
      return alert("PDF library not loaded. Please ensure internet connectivity.");
    }
    const metrics = limitedMetrics(currentChecklistId);
    const selected = metrics.filter(m => selections.has(m.id));
    const pm = perMetricPoints(metrics);
    const score = Math.round(selected.length * pm);
    const total = 100;
    const cls = classifyScore(score, total, { metrics, selectedIds: selected.map(m => m.id) });
    const lists = getChecklists();
    const cl = lists.find(c => c.id === currentChecklistId);
    const logoSrc = (document.getElementById("certificateLogo")?.getAttribute("src")) ||
      (window.QSAS_ASSETS && (window.QSAS_ASSETS["assets/QuXAT Logo Facebook.png"] || window.QSAS_ASSETS["assets/QuXAT%20Logo%20Facebook.png"])) ||
      "assets/QuXAT%20Logo%20Facebook.png";
    let logoDataURL = null;
    try { logoDataURL = await loadImageDataURL(logoSrc); } catch {}
    const doc = new jspdfNS.jsPDF({ unit: "mm", format: "a4" });
    // Decorative background accent
    doc.setFillColor(71,116,226);
    doc.setDrawColor(225,231,245);
    doc.roundedRect(10, 10, 190, 277, 3, 3, "S");
    // Header
    if (logoDataURL) { doc.addImage(logoDataURL, "PNG", 15, 16, 24, 24); }
    doc.setFontSize(18); doc.text("QuXAT Self Assessment Certificate", 45, 22);
    doc.setFontSize(12); doc.setTextColor(107,119,140); doc.text("Quality Score Card", 45, 29);
    doc.setTextColor(0,0,0);
    // Details
    let y = 42; const left = 15;
    const row = (label, value) => { doc.setTextColor(107,119,140); doc.text(label, left, y); doc.setTextColor(0,0,0); doc.text(String(value||"—"), left+60, y); y += 8; };
    row("Participant Email", currentEmail);
    const missing = "Details Not Provided by Self - Assessment User";
    row("Organization", currentOrgName || missing);
    row("Organization Type", currentOrgType || missing);
    row("Representative Name", currentRepName || missing);
    row("Designation", currentRepDesignation || missing);
    row("User Note", currentUserNote || missing);
    row("Checklist", cl ? ((cl.code ? `[${cl.code}] ` : "") + cl.name) : "—");
    row("Checklist Description", cl ? (cl.description || "—") : "—");
    row("Date", new Date().toLocaleString());
    row("Selected Metrics", selected.length);
    const prev = getAssessmentByEmail(currentEmail, currentChecklistId);
    row("Status", prev ? String(prev.status || "pending") : "Not submitted");
    const certCode = generateCertificateCode();
    row("Certificate Code", certCode);
    row("Certificate Generated", new Date().toLocaleString());
    // Score block
    y += 2;
    doc.setFontSize(22); doc.setTextColor(71,116,226);
    doc.text(String(score), left, y);
    doc.setFontSize(12); doc.setTextColor(0,0,0);
    doc.text("QuXAT Self Assessment Score", left+10, y);
    y += 10;
    doc.text(`Score Percent: ${cls.percent}%`, left, y); y += 7;
    doc.text(`Classification: ${cls.label}`, left, y); y += 10;
    // Self-assessment statement
    doc.setTextColor(107,119,140);
    const stmt = "This certificate is based on the self assessment provided by the organization’s authorized representative.";
    const splitStmt = doc.splitTextToSize(stmt, 180);
    splitStmt.forEach(ln => { doc.text(ln, left, y); y += 6; });
    doc.setTextColor(0,0,0);
    // Suggestions header
    doc.setFont(undefined, "bold"); doc.text("Suggested Improvements", left, y); doc.setFont(undefined, "normal"); y += 7;
    (cls.suggestions || []).forEach(s => { const split = doc.splitTextToSize(`• ${s}`, 180); split.forEach(ln => { doc.text(ln, left, y); y += 6; if (y > 275) { doc.addPage(); y = 20; } }); });
    doc.save(`QuXAT-Certificate-${currentEmail}.pdf`);
  });

  submitVerificationBtn.addEventListener("click", () => {
    if (!currentEmail) return alert("Please enter your email and start the assessment.");
    if (!currentChecklistId) return alert("Please choose a checklist to continue.");
    const selectedIds = Array.from(selections);
    if (selectedIds.length === 0) return alert("Please select at least one metric before submitting.");
    const missing = "Details Not Provided by Self - Assessment User";
    const payload = submitAssessment(currentEmail, selectedIds, currentChecklistId, {
      orgName: currentOrgName || missing,
      orgType: currentOrgType || missing,
      repName: currentRepName || missing,
      repDesignation: currentRepDesignation || missing,
      userNote: currentUserNote || missing,
    });
    alert("Assessment submitted to Admin for verification.");
    updateActionButtonsVisibility();
  });

  function download(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function generatePdfReport(assessment, verified, filename) {
    const jspdfNS = window.jspdf;
    if (!jspdfNS || !jspdfNS.jsPDF) {
      return alert("PDF library not loaded. Please ensure internet connectivity.");
    }
    const doc = new jspdfNS.jsPDF({ unit: "mm", format: "a4" });

    const statusLabel = verified ? "VERIFIED AND APPROVED REPORT" : "UNVERIFIED SELF-ASSESSMENT REPORT";
    const lines = [];
    lines.push({ t: "QuXAT Self Assessment Certificate", style: "h1" });
    lines.push({ t: statusLabel, style: verified ? "ok" : "warn" });
    lines.push({ t: `Email: ${assessment.email}` });
    if (assessment.checklistName || assessment.checklistId) {
      lines.push({ t: `Checklist: ${assessment.checklistName || assessment.checklistId}` });
    }
    if (assessment.orgName) lines.push({ t: `Organization: ${assessment.orgName}` });
    if (assessment.orgType) lines.push({ t: `Organization Type: ${assessment.orgType}` });
    if (assessment.repName) lines.push({ t: `Representative Name: ${assessment.repName}` });
    if (assessment.repDesignation) lines.push({ t: `Designation: ${assessment.repDesignation}` });
    if (assessment.userNote) lines.push({ t: `User Note: ${assessment.userNote}` });
    lines.push({ t: `QuXAT Self Assessment Score: ${assessment.score}` });
    lines.push({ t: `Classification: ${assessment.classification || "-"} (${assessment.scorePercent ?? 0}%)` });
    lines.push({ t: `Submitted At: ${assessment.submittedAt || "-"}` });
    lines.push({ t: `Verified At: ${assessment.verifiedAt || "-"}` });
    const code = assessment.certificateCode || generateCertificateCode();
    const genAt = assessment.certificateGeneratedAt || new Date().toISOString();
    lines.push({ t: `Certificate Code: ${code}` });
    lines.push({ t: `Certificate Generated: ${genAt}` });
    if (assessment.adminNote) lines.push({ t: `Admin Note: ${assessment.adminNote}` });
    lines.push({ t: "" });
    if (Array.isArray(assessment.suggestions) && assessment.suggestions.length) {
      lines.push({ t: "" });
      lines.push({ t: "Suggested Improvements:", style: "h2" });
      assessment.suggestions.forEach(s => lines.push({ t: `• ${s}` }));
    }
    lines.push({ t: "Selected Metrics:", style: "h2" });
    assessment.selectedMetrics.forEach(m => lines.push({ t: `• ${m.name} (+${m.points})` }));
    lines.push({ t: "" });
    lines.push({ t: "Notes:", style: "h2" });
    if (!verified) {
      lines.push({ t: "This report is generated by the user and is unverified." });
      lines.push({ t: "It is provided for self-assessment only and not an approval." });
    } else {
      lines.push({ t: "This report has been verified and approved by Admin." });
    }

    let y = 20;
    const left = 15;
    doc.setFontSize(18); doc.text("QuXAT Self Assessment Certificate", left, y); y += 8;
    doc.setFontSize(12);
    doc.setTextColor(verified ? 0 : 200, verified ? 128 : 80, verified ? 0 : 0);
    doc.text(statusLabel, left, y); y += 10;
    doc.setTextColor(0,0,0);

    const writeLine = (text, opts = {}) => {
      const maxWidth = 180; // mm
      const split = doc.splitTextToSize(text, maxWidth);
      split.forEach((ln) => {
        if (y > 280) { doc.addPage(); y = 20; }
        if (opts.style === "h2") doc.setFont(undefined, "bold"); else doc.setFont(undefined, "normal");
        doc.text(ln, left, y);
        y += 6;
      });
    };

    writeLine(`Email: ${assessment.email}`);
    if (assessment.checklistName || assessment.checklistId) {
      writeLine(`Checklist: ${assessment.checklistName || assessment.checklistId}`);
    }
    if (assessment.orgName) writeLine(`Organization: ${assessment.orgName}`);
    if (assessment.repName) writeLine(`Representative Name: ${assessment.repName}`);
    if (assessment.repDesignation) writeLine(`Designation: ${assessment.repDesignation}`);
    if (assessment.userNote) writeLine(`User Note: ${assessment.userNote}`);
    writeLine(`QuXAT Self Assessment Score: ${assessment.score}`);
    writeLine(`Classification: ${assessment.classification || "-"} (${assessment.scorePercent ?? 0}%)`);
    writeLine(`Submitted At: ${assessment.submittedAt || "-"}`);
    writeLine(`Verified At: ${assessment.verifiedAt || "-"}`);
    const code2 = assessment.certificateCode || generateCertificateCode();
    const genAt2 = assessment.certificateGeneratedAt || new Date().toISOString();
    writeLine(`Certificate Code: ${code2}`);
    writeLine(`Certificate Generated: ${genAt2}`);
    if (assessment.adminNote) writeLine(`Admin Note: ${assessment.adminNote}`);
    y += 4;
    // Suggested improvements block
    if (Array.isArray(assessment.suggestions) && assessment.suggestions.length) {
      writeLine("Suggested Improvements:", { style: "h2" });
      assessment.suggestions.forEach(s => writeLine(`• ${s}`));
      y += 4;
    }
    writeLine("Selected Metrics:", { style: "h2" });
    assessment.selectedMetrics.forEach(m => writeLine(`• ${m.name} (+${m.points})`));
    y += 4;
    writeLine("Notes:", { style: "h2" });
    writeLine("This certificate is based on the self assessment provided by the organization’s authorized representative.");
    if (!verified) {
      writeLine("This report is generated by the user and is unverified.");
      writeLine("It is provided for self-assessment only and not an approval.");
    } else {
      writeLine("This report has been verified and approved by Admin.");
    }

    doc.save(filename);
  }

  function isValidEmail(email) {
    const v = (email || "").trim();
    if (!v) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(v);
  }

  function promptForEmail(message = "Enter a VALID email ID used during self assessment to receive your verified certification copy. For assistance, contact quxat.team@gmail.com:") {
    let attempts = 0;
    while (attempts < 3) {
      const v = prompt(message);
      if (v === null) return ""; // user cancelled
      const trimmed = (v || "").trim();
      if (!trimmed) return "";
      if (isValidEmail(trimmed)) return trimmed;
      alert("Please enter a valid email address, e.g., name@domain.tld");
      attempts++;
    }
    return "";
  }

  downloadUnverifiedBtn.addEventListener("click", () => {
    if (!currentEmail) return alert("Please enter your email and start the assessment.");
    if (!currentChecklistId) return alert("Please choose a checklist to continue.");
    const selectedIds = Array.from(selections);
    if (selectedIds.length === 0) return alert("Please select at least one metric.");
    const entered = promptForEmail();
    if (!entered) return;
    if (entered.toLowerCase() !== currentEmail.toLowerCase()) {
      return alert("The entered email does not match the email used during this self assessment.");
    }
    // Create transient assessment snapshot for PDF
    const metrics = limitedMetrics(currentChecklistId);
    const pm = perMetricPoints(metrics);
    const selected = metrics.filter(m => selectedIds.includes(m.id)).map(m => ({ id: m.id, name: m.name, points: Math.round(pm) }));
    const score = Math.round(selected.length * pm);
    const total = 100;
    const cls = classifyScore(score, total, { metrics, selectedIds });
    const lists = getChecklists();
    const cl = lists.find(c => c.id === currentChecklistId) || { id: currentChecklistId, name: "General" };
    const missing = "Details Not Provided by Self - Assessment User";
    const tempAssessment = { email: currentEmail, checklistId: cl.id, checklistName: cl.name, selectedMetrics: selected, score, scorePercent: cls.percent, classification: cls.label, suggestions: cls.suggestions, submittedAt: new Date().toISOString(), verifiedAt: null, adminNote: "", orgName: currentOrgName || missing, orgType: currentOrgType || missing, repName: currentRepName || missing, repDesignation: currentRepDesignation || missing, userNote: currentUserNote || missing };
    generatePdfReport(tempAssessment, false, `QuXAT-Self-Assessment-${currentEmail}-UNVERIFIED.pdf`);
  });

  downloadVerifiedBtn.addEventListener("click", () => {
    const email = promptForEmail("Enter a VALID email ID used during self assessment to download the verified report. For assistance getting your verified certificate, contact quxat.team@gmail.com:");
    if (!email) return;
    const a = getAssessmentByEmail(email, currentChecklistId || null);
    if (!a) return alert("No submitted assessment found for this email.");
    if (a.status !== "approved") return alert("Assessment not yet approved by Admin.");
    generatePdfReport(a, true, `QSAS-${email}-VERIFIED.pdf`);
  });

  render();
})();
  function setHeaderMedia(targetEl, checklistName){
    if (!targetEl) return;
    const name = String(checklistName || '').toLowerCase();
    // Inline SVG icon for "How Safe is your City ?"
    const showCity = name.includes('how safe is your city');
    if (showCity) {
      targetEl.style.display = 'block';
      targetEl.innerHTML = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="60" height="60"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4774E2"/><stop offset="100%" stop-color="#49D2A8"/></linearGradient></defs><rect x="2" y="36" width="60" height="26" rx="6" fill="#E9EEF9"/><path d="M8 36 V22 l6-4 v18 M22 36 V18 l6-6 v24 M36 36 V24 l8-4 v16" stroke="url(#g)" stroke-width="2" fill="none"/><circle cx="52" cy="20" r="8" fill="#FFE08A" stroke="#E5B84C"/><path d="M6 58 h52" stroke="#B8C2D9" stroke-width="2"/></svg>';
    } else {
      targetEl.style.display = 'none';
      targetEl.innerHTML = '';
    }
  }

  function currentShareUrl() {
    try {
      const base = (window.top || window).location.origin;
      const params = new URLSearchParams();
      params.set('section','User Assessment');
      if (currentCategory) params.set('category', currentCategory);
      if (currentChecklistId) params.set('checklist', currentChecklistId);
      return base + '/?' + params.toString();
    } catch(e) { return ''; }
  }

  function currentShortUrl() {
    try {
      const base = (window.top || window).location.origin;
      const payload = { section: 'User Assessment', category: currentCategory || '', checklist: currentChecklistId || '' };
      const b64 = btoa(JSON.stringify(payload)).replace(/\+/g,'-').replace(/\//g,'_');
      const params = new URLSearchParams();
      params.set('section','User Assessment');
      params.set('s', b64);
      return base + '/?' + params.toString();
    } catch(e) { return ''; }
  }

  function wireShareButtons() {
    const full = currentShareUrl();
    const short = currentShortUrl();
    function copy(text){ try { navigator.clipboard.writeText(text); alert('Link copied to clipboard'); } catch(e){ alert(text); } }
    if (copyShareLinkBtn) copyShareLinkBtn.onclick = () => copy(full);
    if (copyShortLinkBtn) copyShortLinkBtn.onclick = () => copy(short);
    if (copyShareLinkStartBtn) copyShareLinkStartBtn.onclick = () => copy(full);
    if (copyShortLinkStartBtn) copyShortLinkStartBtn.onclick = () => copy(short);
  }
