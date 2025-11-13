// Storage utilities for QSAS
const QSAS_KEYS = {
  // QSAS Admin Portal credentials (distinct from HQ Grid Admin)
  adminUser: "qsas_portal_username",
  adminPass: "qsas_portal_password",
  // legacy single-metrics key
  metrics: "qsas_metrics",
  // new multi-checklist keys
  checklists: "qsas_checklists",
  metricsByChecklist: "qsas_metrics_by_checklist",
  assessments: "qsas_assessments",
  // Healthcare Quality Grid registrations
  gridRegistrations: "qsas_grid_registrations",
  seeded: "qsas_seeded_v4",
};

// QSAS normalization constants
const QSAS_METRIC_LIMIT = 10;
const QSAS_MAX_SCORE = 100;

function ensureDefaults() {
  if (!localStorage.getItem(QSAS_KEYS.adminUser)) {
    localStorage.setItem(QSAS_KEYS.adminUser, "admin");
  }
  if (!localStorage.getItem(QSAS_KEYS.adminPass)) {
    localStorage.setItem(QSAS_KEYS.adminPass, "quxat123");
  }
  // initialize checklists and metrics mapping
  if (!localStorage.getItem(QSAS_KEYS.checklists)) {
    // Start with no predefined checklist; Admin will create/publish.
    localStorage.setItem(QSAS_KEYS.checklists, JSON.stringify([]));
  }
  if (!localStorage.getItem(QSAS_KEYS.metricsByChecklist)) {
    // Initialize empty mapping; metrics belong to a created checklist.
    localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify({}));
  }
  if (!localStorage.getItem(QSAS_KEYS.assessments)) {
    localStorage.setItem(QSAS_KEYS.assessments, JSON.stringify([]));
  }
  if (!localStorage.getItem(QSAS_KEYS.gridRegistrations)) {
    localStorage.setItem(QSAS_KEYS.gridRegistrations, JSON.stringify([]));
  }
  // Migrate legacy baseline names to organization-oriented titles
  try {
    const raw = localStorage.getItem(QSAS_KEYS.checklists) || "[]";
    const lists = JSON.parse(raw);
    if (Array.isArray(lists) && lists.length) {
      const renameMap = {
        "Healthcare Public Baseline": "Hospital - Self Assessment",
        "Workplace Safety Baseline": "Workplace - Self Assessment",
        "Education Quality Baseline": "School/College - Self Assessment",
      };
      let changed = false;
      lists.forEach(c => {
        const next = renameMap[String(c.name || "")] || null;
        if (next && next !== c.name) { c.name = next; changed = true; }
      });
      if (changed) localStorage.setItem(QSAS_KEYS.checklists, JSON.stringify(lists));
    }
  } catch {}

  // Seed public-domain baseline checklists (organization-oriented titles)
  try {
    const seeded = localStorage.getItem(QSAS_KEYS.seeded) === "true";
    const lists = JSON.parse(localStorage.getItem(QSAS_KEYS.checklists) || "[]") || [];
    const byName = new Map((Array.isArray(lists) ? lists : []).map(c => [String(c.name || ""), c]));

    function addBaselineIfMissing(name, description, category, metricsBase) {
      if (byName.has(name)) return byName.get(name).id;
      const id = generateId();
      const code = generateChecklistCode();
      const entry = { id, code, name, description, category, published: true };
      lists.push(entry);
      byName.set(name, entry);
      // attach metrics
      const metrics = (metricsBase || []).map(m => ({ id: generateId(), code: generateMetricCode(), name: m.name, points: Number(m.points) || 5 }));
      const mapRaw = localStorage.getItem(QSAS_KEYS.metricsByChecklist) || "{}";
      const map = JSON.parse(mapRaw) || {};
      map[id] = metrics;
      localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify(map));
      return id;
    }

    // Always ensure these baselines exist; do not overwrite existing custom lists
    const healthcareId = addBaselineIfMissing(
      "Hospital - Self Assessment",
      "Public-domain inspired baseline for hospitals and healthcare organizations.",
      "Hospitals & Healthcare",
      [
        { name: "Hand Hygiene Program with Routine Audits", points: 5 },
        { name: "Personal Protective Equipment Availability and Use", points: 5 },
        { name: "Medication Management (storage, labeling, reconciliation)", points: 5 },
        { name: "Safe Surgery Checklist / Time-out Process", points: 5 },
        { name: "Patient Identification Protocols", points: 5 },
        { name: "Incident Reporting and Root-cause Analysis", points: 5 },
        { name: "Emergency Preparedness Drills (fire, code blue)", points: 5 },
        { name: "Clinical Documentation Standards", points: 5 },
        { name: "Infection Prevention & Control Practices", points: 5 },
        { name: "Biomedical Equipment Maintenance Records", points: 5 },
        { name: "Waste Segregation and Safe Disposal", points: 5 },
        { name: "Staff Training and Competency Checks", points: 5 },
      ]
    );

    const workplaceId = addBaselineIfMissing(
      "Workplace - Self Assessment",
      "Generic safety baseline for industry, offices, and public facilities.",
      "Industry & Offices",
      [
        { name: "Hazard Identification and Risk Register", points: 5 },
        { name: "Emergency Exits and Evacuation Plan", points: 5 },
        { name: "Fire Safety Equipment Inspection Logs", points: 5 },
        { name: "Electrical Safety and Lockout/Tagout", points: 5 },
        { name: "First Aid Readiness and Trained Responders", points: 5 },
        { name: "Personal Protective Equipment Policy", points: 5 },
        { name: "Incident/ Near-miss Reporting", points: 5 },
        { name: "Contractor/Visitor Safety Induction", points: 5 },
        { name: "Safety Signage and Housekeeping", points: 5 },
        { name: "Routine Safety Audits", points: 5 },
        { name: "Chemical Handling and MSDS Access", points: 5 },
        { name: "Ergonomics and Workstation Assessments", points: 5 },
      ]
    );

    const educationId = addBaselineIfMissing(
      "School/College - Self Assessment",
      "Quality and safety baseline for schools and colleges.",
      "Schools & Colleges",
      [
        { name: "Student Safety Policy and Incident Response", points: 5 },
        { name: "Laboratory Safety Controls and Training", points: 5 },
        { name: "Health & Sanitation (water, hygiene, waste)", points: 5 },
        { name: "Emergency Drills and Communication", points: 5 },
        { name: "Documentation of Academic Policies", points: 5 },
        { name: "Staff Training and Competence Records", points: 5 },
        { name: "Facility Maintenance Logs", points: 5 },
        { name: "Data Protection and Access Controls", points: 5 },
        { name: "Feedback and Grievance Handling", points: 5 },
        { name: "Internal Audit/Review Cycle", points: 5 },
      ]
    );

    // New: Diagnostic Laboratory, Pharmacy, and Dental Clinic organization-specific baselines
    const labId = addBaselineIfMissing(
      "Diagnostic Laboratory - Self Assessment",
      "Baseline for medical laboratories covering quality control, biosafety, and traceability.",
      "Hospitals & Healthcare",
      [
        { name: "Specimen Collection SOPs and Patient ID Verification", points: 5 },
        { name: "Specimen Labeling and Traceability", points: 5 },
        { name: "Cold Chain Management and Transport Logs", points: 5 },
        { name: "Equipment Calibration and Preventive Maintenance", points: 5 },
        { name: "Internal Quality Control (IQC) Documentation", points: 5 },
        { name: "External Quality Assessment / Proficiency Testing (EQA/PT)", points: 5 },
        { name: "Laboratory Biosafety and PPE Compliance", points: 5 },
        { name: "Biohazard Waste Segregation and Disposal", points: 5 },
        { name: "Result Validation and Critical Value Reporting", points: 5 },
        { name: "Turnaround Time Monitoring and Improvement", points: 5 },
        { name: "LIS/Data Integrity and Access Controls", points: 5 },
        { name: "Staff Competency and Training Records", points: 5 },
      ]
    );

    const pharmacyId = addBaselineIfMissing(
      "Pharmacy - Self Assessment",
      "Baseline for pharmacy practice including storage, dispensing, reconciliation, and safety.",
      "Hospitals & Healthcare",
      [
        { name: "Prescription Verification and Dispensing SOPs", points: 5 },
        { name: "Controlled Substances Storage and Records", points: 5 },
        { name: "Temperature Monitoring for Medications (cold chain)", points: 5 },
        { name: "Expiry Management (FEFO) and Stock Rotation", points: 5 },
        { name: "Patient Counseling and Documentation", points: 5 },
        { name: "Medication Reconciliation Process", points: 5 },
        { name: "Adverse Drug Reaction Reporting", points: 5 },
        { name: "Look‑alike/Sound‑alike (LASA) Safety Labeling", points: 5 },
        { name: "Narcotic/Controlled Drug Register Security", points: 5 },
        { name: "Procurement and Supplier Qualification", points: 5 },
        { name: "Pharmacy Hygiene and Housekeeping", points: 5 },
        { name: "Staff Training and License Compliance", points: 5 },
      ]
    );

    const dentalId = addBaselineIfMissing(
      "Dental Clinic - Self Assessment",
      "Baseline for dental clinics covering sterilization, infection control, radiology safety, and documentation.",
      "Hospitals & Healthcare",
      [
        { name: "Instrument Sterilization and Tracking (autoclave logs)", points: 5 },
        { name: "Infection Control Protocols and PPE Use", points: 5 },
        { name: "Sharps Safety and Waste Segregation", points: 5 },
        { name: "Dental Radiology Safety and Dosimetry", points: 5 },
        { name: "Patient Consent and Clinical Documentation", points: 5 },
        { name: "Emergency Kit Readiness and Basic Life Support", points: 5 },
        { name: "X‑ray Equipment Maintenance and QA", points: 5 },
        { name: "Dental Unit Waterline Disinfection", points: 5 },
        { name: "Material Storage and Expiry Controls", points: 5 },
        { name: "Equipment Maintenance Records", points: 5 },
        { name: "Patient Identification and Procedure Time‑out", points: 5 },
        { name: "Incident/Near‑miss Reporting", points: 5 },
      ]
    );

    // New: Student Safety checklists for Colleges & Universities and Schools
    const cuSafetyId = addBaselineIfMissing(
      "Colleges & Universities - Student Safety Checklist",
      "Focused checklist for student safety, security, health, and incident handling in colleges and universities.",
      "Colleges & Universities",
      [
        { name: "Campus Security and CCTV Coverage (critical areas)", points: 5 },
        { name: "Student ID Badging and Access Control", points: 5 },
        { name: "Anti‑Harassment Policy and Reporting Mechanism", points: 5 },
        { name: "Emergency Evacuation Drills and Communication", points: 5 },
        { name: "Health Centre / First Aid Readiness", points: 5 },
        { name: "Transport Safety: Vehicle Checks and Driver Vetting", points: 5 },
        { name: "Laboratory Safety Induction for Practical Courses", points: 5 },
        { name: "Hostel Safety: Wardens, Visitor Logs, Curfew", points: 5 },
        { name: "Fire Safety Equipment Inspection Logs", points: 5 },
        { name: "Grievance Redressal Committee Records", points: 5 },
      ]
    );

    const schoolSafetyId = addBaselineIfMissing(
      "Schools - Student Safety Checklist",
      "Focused checklist for student safety covering child protection, transport, drills, and incident reporting.",
      "Schools",
      [
        { name: "Child Protection Policy and POCSO Awareness", points: 5 },
        { name: "Visitor Management and Student Pick‑up Protocols", points: 5 },
        { name: "Classroom and Playground Safety Checks", points: 5 },
        { name: "Emergency Drills and Parent Communication", points: 5 },
        { name: "Health & Sanitation: Water Quality and Hygiene", points: 5 },
        { name: "Bus Transport Safety: GPS and Driver Records", points: 5 },
        { name: "Laboratory Safety and Chemical Storage", points: 5 },
        { name: "CCTV and Surveillance for Critical Areas", points: 5 },
        { name: "Staff Background Verification Records", points: 5 },
        { name: "Incident Reporting and Parent Notification Logs", points: 5 },
      ]
    );

    // New: Quality Improvement Checklists across requested categories
    const QI_METRICS = [
      { name: "Internal Audit Schedule and Reports", points: 5 },
      { name: "Corrective and Preventive Actions (CAPA) Tracking", points: 5 },
      { name: "SOP Review Cycle and Version Control", points: 5 },
      { name: "Training Plan and Competence Records", points: 5 },
      { name: "Feedback Collection and Analysis (stakeholders)", points: 5 },
      { name: "Risk Register and Mitigation Actions", points: 5 },
      { name: "Management Review Minutes and Actions", points: 5 },
      { name: "Process KPIs Monitoring and Trends", points: 5 },
      { name: "Data Quality Monitoring and Validation", points: 5 },
      { name: "Continuous Improvement Projects (PDCA)", points: 5 },
      { name: "Compliance Self‑Inspection Checks", points: 5 },
      { name: "Documentation and Records Retention Controls", points: 5 },
    ];

    addBaselineIfMissing(
      "Schools - Quality Improvement Checklist",
      "Quality improvement framework focusing on audits, CAPA, SOPs, training, and KPIs.",
      "Schools",
      QI_METRICS
    );

    // Create separate visible entries for Colleges and Universities, grouped under the combined category
    addBaselineIfMissing(
      "Colleges - Quality Improvement Checklist",
      "Quality improvement framework for colleges focusing on audits, CAPA, SOPs, training, and KPIs.",
      "Colleges & Universities",
      QI_METRICS
    );

    addBaselineIfMissing(
      "Universities - Quality Improvement Checklist",
      "Quality improvement framework for universities focusing on audits, CAPA, SOPs, training, and KPIs.",
      "Colleges & Universities",
      QI_METRICS
    );

    addBaselineIfMissing(
      "Public & Community Organizations - Quality Improvement Checklist",
      "Quality improvement framework for public/community organizations covering audits, CAPA, SOPs, and KPIs.",
      "Public & Community Organizations",
      QI_METRICS
    );

    addBaselineIfMissing(
      "Highway Development Organizations - Quality & Safety Improvement",
      "Quality and safety improvement checklist for highway development organizations in India, focusing on traffic management, worksite safety, materials quality, and environmental controls.",
      "Public & Community Organizations",
      [
        { name: "Work Zone Traffic Management Plan implemented", points: 5 },
        { name: "Road Safety Audit conducted at key stages", points: 5 },
        { name: "Signage and Barricading per IRC standards", points: 5 },
        { name: "PPE compliance for site workers and supervisors", points: 5 },
        { name: "Contractor Safety Induction and Toolbox Talks", points: 5 },
        { name: "Incident/Near‑miss Reporting and Root‑Cause Analysis", points: 5 },
        { name: "Equipment Preventive Maintenance and Logs", points: 5 },
        { name: "Material Testing and Quality Control (aggregate, asphalt, concrete)", points: 5 },
        { name: "Compaction and Layer Thickness Verification records", points: 5 },
        { name: "Environmental Management: dust, noise, waste controls", points: 5 },
        { name: "Emergency Response and First‑Aid Readiness on site", points: 5 },
        { name: "Public Communication and Grievance Handling mechanisms", points: 5 },
      ]
    );

    addBaselineIfMissing(
      "How Safe is your City ?",
      "Assessment checklist for city safety organizations to evaluate citizen safety readiness, response, transparency, and community engagement.",
      "Public & Community Organizations",
      [
        { name: "Crime reporting channels accessible (dial, app, web) and publicized", points: 10 },
        { name: "Street lighting coverage audits with remediation tracking", points: 10 },
        { name: "CCTV coverage at critical hotspots with uptime monitoring", points: 10 },
        { name: "Patrol routes planned and executed with digital logs", points: 10 },
        { name: "Emergency response time targets defined and measured", points: 10 },
        { name: "Community policing and citizen outreach programs active", points: 10 },
        { name: "Victim support services and helplines operational", points: 10 },
        { name: "Traffic safety controls (speed calming, crossings, signage) audited", points: 10 },
        { name: "Disaster preparedness plans and drills conducted", points: 10 },
        { name: "Safety data transparency (dashboards/reports) with grievance redressal", points: 10 },
      ]
    );

    addBaselineIfMissing(
      "Identify Toxic Workplace and Culture",
      "Checklist to identify and address toxic workplace behaviors and cultural risks in offices and corporate environments.",
      "Offices & Corporate",
      [
        { name: "Anonymous reporting and whistleblower protection implemented", points: 10 },
        { name: "Anti‑harassment policy and training with enforcement records", points: 10 },
        { name: "Retaliation policy enforced; investigation logs maintained", points: 10 },
        { name: "Leadership accountability and 360‑degree feedback practiced", points: 10 },
        { name: "Workload and overtime monitoring with corrective actions", points: 10 },
        { name: "Compensation and promotion transparency (pay equity reviews)", points: 10 },
        { name: "Grievance redressal mechanism responsive with SLA", points: 10 },
        { name: "Respectful communication code and conflict resolution SOP", points: 10 },
        { name: "Mental health support and EAP access promoted", points: 10 },
        { name: "Diversity, equity, inclusion metrics tracked and reviewed", points: 10 },
      ]
    );

    addBaselineIfMissing(
      "Industrial & Manufacturing - Quality Improvement Checklist",
      "Quality improvement framework for industrial and manufacturing organizations focusing on audits, CAPA, SOPs, training, KPIs, and risk management.",
      "Industrial & Manufacturing",
      QI_METRICS
    );

    // Persist updated checklists and mark seeding complete for v2
    localStorage.setItem(QSAS_KEYS.checklists, JSON.stringify(lists));
    if (!seeded) localStorage.setItem(QSAS_KEYS.seeded, "true");
  } catch {}
}

function getAdminCreds() {
  ensureDefaults();
  return {
    username: localStorage.getItem(QSAS_KEYS.adminUser) || "admin",
    password: localStorage.getItem(QSAS_KEYS.adminPass) || "quxat123",
  };
}

function saveAdminCreds(username, password) {
  localStorage.setItem(QSAS_KEYS.adminUser, String(username || ""));
  localStorage.setItem(QSAS_KEYS.adminPass, String(password || ""));
}

// Checklists API
function getChecklists() {
  ensureDefaults();
  try {
    const raw = localStorage.getItem(QSAS_KEYS.checklists) || "[]";
    const arr = JSON.parse(raw);
    const lists = Array.isArray(arr) ? arr : [];
    ensureChecklistCodes(lists);
    // Backward compatibility: default missing published -> true
    return lists.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description || "",
      category: typeof c.category === "string" ? c.category : "",
      published: typeof c.published === "boolean" ? c.published : true,
    }));
  } catch { return []; }
}

function saveChecklists(list) {
  localStorage.setItem(QSAS_KEYS.checklists, JSON.stringify(Array.isArray(list) ? list : []));
}

function addChecklist(name, description = "", category = "") {
  const lists = getChecklists();
  const id = generateId();
  // New checklists start as drafts (published: false) with a unique code
  const existingCodes = new Set(lists.map(c => c.code).filter(Boolean));
  let code;
  do { code = generateChecklistCode(); } while (existingCodes.has(code));
  lists.push({ id, code, name: String(name), description: String(description || ""), category: String(category || ""), published: false });
  saveChecklists(lists);
  return id;
}

function updateChecklist(id, name, description = "", category = "") {
  const lists = getChecklists();
  const idx = lists.findIndex(c => c.id === id);
  if (idx !== -1) {
    const prev = lists[idx];
    lists[idx] = { id, code: prev.code, name: String(name), description: String(description || ""), category: String(category || prev.category || ""), published: typeof prev.published === "boolean" ? prev.published : true };
    saveChecklists(lists);
    return true;
  }
  return false;
}

function deleteChecklist(id) {
  const lists = getChecklists();
  const next = lists.filter(c => c.id !== id);
  saveChecklists(next);
  // remove associated metrics
  ensureDefaults();
  try {
    const map = JSON.parse(localStorage.getItem(QSAS_KEYS.metricsByChecklist) || "{}") || {};
    delete map[id];
    localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify(map));
  } catch {}
  return true;
}

function setChecklistPublished(id, flag) {
  const lists = getChecklists();
  const idx = lists.findIndex(c => c.id === id);
  if (idx === -1) return false;
  lists[idx].published = !!flag;
  saveChecklists(lists);
  return true;
}

function publishChecklist(id) {
  return setChecklistPublished(id, true);
}

// Metrics per-checklist API
function getMetrics(checklistId = "") {
  ensureDefaults();
  if (!checklistId) return [];
  ensureMetricCodes();
  try {
    const raw = localStorage.getItem(QSAS_KEYS.metricsByChecklist) || "{}";
    const map = JSON.parse(raw) || {};
    const arr = map[checklistId] || [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

// Return up to the first 10 metrics for a checklist
function getMetricsLimited(checklistId = "", limit = QSAS_METRIC_LIMIT) {
  const all = getMetrics(checklistId) || [];
  return all.slice(0, Math.max(0, Math.min(limit, all.length)));
}

function saveMetrics(checklistId, list) {
  ensureDefaults();
  if (!checklistId) return;
  try {
    const raw = localStorage.getItem(QSAS_KEYS.metricsByChecklist) || "{}";
    const map = JSON.parse(raw) || {};
    map[String(checklistId || "default")] = Array.isArray(list) ? list : [];
    localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify(map));
  } catch {
    const map = { [String(checklistId || "")]: Array.isArray(list) ? list : [] };
    localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify(map));
  }
}

function addMetric(checklistId, name, points) {
  if (!checklistId) return null;
  const metrics = getMetrics(checklistId);
  const id = generateId();
  const code = generateMetricCode();
  metrics.push({ id, code, name: String(name), points: Number(points) || 0 });
  saveMetrics(checklistId, metrics);
  return id;
}

function updateMetric(checklistId, id, name, points) {
  if (!checklistId) return false;
  const metrics = getMetrics(checklistId);
  const idx = metrics.findIndex(m => m.id === id);
  if (idx !== -1) {
    const code = metrics[idx].code || generateMetricCode();
    metrics[idx] = { id, code, name: String(name), points: Number(points) || 0 };
    saveMetrics(checklistId, metrics);
    return true;
  }
  return false;
}

function deleteMetric(checklistId, id) {
  if (!checklistId) return false;
  const metrics = getMetrics(checklistId);
  const next = metrics.filter(m => m.id !== id);
  saveMetrics(checklistId, next);
  return true;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Assessments storage and report helpers
function getAssessments() {
  ensureDefaults();
  try {
    const raw = localStorage.getItem(QSAS_KEYS.assessments) || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveAssessments(list) {
  localStorage.setItem(QSAS_KEYS.assessments, JSON.stringify(Array.isArray(list) ? list : []));
}

function submitAssessment(email, selectedIds, checklistId = "", details = {}) {
  if (!checklistId) return null;
  // Enforce limit and normalize scoring to 100
  const metrics = getMetricsLimited(checklistId);
  const perMetric = metrics.length ? (QSAS_MAX_SCORE / Math.min(QSAS_METRIC_LIMIT, metrics.length)) : 0;
  const selected = metrics
    .filter(m => selectedIds.includes(m.id))
    .map(m => ({ id: m.id, code: m.code || "", name: m.name, points: perMetric }));
  const score = Math.round(selected.length * perMetric);
  const total = QSAS_MAX_SCORE;
  const cls = classifyScore(score, total, { metrics, selectedIds });
  const assessments = getAssessments();
  const now = new Date().toISOString();
  const lists = getChecklists();
  const checklist = lists.find(c => c.id === checklistId) || { id: checklistId, code: "", name: "Checklist" };
  const payload = {
    id: generateId(),
    email: String(email),
    checklistId: checklist.id,
    checklistCode: checklist.code || "",
    checklistName: checklist.name,
    selectedMetrics: selected,
    score,
    scorePercent: cls.percent,
    classification: cls.label,
    suggestions: cls.suggestions,
    status: "pending",
    submittedAt: now,
    verifiedAt: null,
    adminNote: "",
    orgName: String(details?.orgName || ""),
    orgType: String(details?.orgType || ""),
    repName: String(details?.repName || ""),
    repDesignation: String(details?.repDesignation || ""),
    userNote: String(details?.userNote || ""),
  };
  // replace existing submission for this email+checklist if present
  const existingIdx = assessments.findIndex(a => (a.email || "").toLowerCase() === String(email).toLowerCase() && a.checklistId === checklistId);
  if (existingIdx !== -1) assessments[existingIdx] = payload; else assessments.push(payload);
  saveAssessments(assessments);
  return payload;
}

// Checklist code utilities
function ensureChecklistCodes(lists) {
  if (!Array.isArray(lists)) return;
  const seen = new Set(lists.map(c => c.code).filter(Boolean));
  let changed = false;
  lists.forEach(c => {
    if (!c.code) {
      let code;
      do { code = generateChecklistCode(); } while (seen.has(code));
      c.code = code;
      seen.add(code);
      changed = true;
    }
  });
  if (changed) saveChecklists(lists);
}

function generateChecklistCode() {
  const prefix = "QHCC"; // 4 chars
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix + suffix; // total 10 characters
}

// Ensure all metrics have a unique code of the form QSAS****** (10 chars total)
function ensureMetricCodes() {
  try {
    const raw = localStorage.getItem(QSAS_KEYS.metricsByChecklist) || "{}";
    const map = JSON.parse(raw) || {};
    const seen = new Set();
    let changed = false;
    // collect existing codes
    Object.values(map).forEach(list => {
      (Array.isArray(list) ? list : []).forEach(m => { if (m.code) seen.add(m.code); });
    });
    // fill missing codes
    Object.keys(map).forEach(k => {
      const list = Array.isArray(map[k]) ? map[k] : [];
      list.forEach(m => {
        if (!m.code) {
          let code;
          do { code = generateMetricCode(); } while (seen.has(code));
          m.code = code;
          seen.add(code);
          changed = true;
        }
      });
      map[k] = list;
    });
    if (changed) localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify(map));
  } catch { /* ignore */ }
}

function generateMetricCode() {
  const prefix = "QSAS"; // 4
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix + suffix; // 10 characters total
}

// Compute QuXAT scoring classification and suggestions based on percentage
// Optionally augment suggestions with gap-based items derived from metric responses.
function classifyScore(score, total, opts = {}) {
  const percent = total ? Math.round((score / total) * 100) : 0;
  let label = "";
  let suggestions = [];
  // Healthcare Quality Improvement oriented bands
  if (percent >= 90) {
    label = "Exemplary Quality Improvement";
    suggestions = [
      "Sustain gains with quarterly Plan–Do–Study–Act cycles and executive reviews",
      "Embed run charts and control charts in clinical dashboards",
      "Advance to outcome measures such as readmissions, length of stay, and patient safety events",
    ];
  } else if (percent >= 75) {
    label = "Strong Quality Improvement";
    suggestions = [
      "Standardize high-impact processes such as medication reconciliation and hand hygiene",
      "Close gaps via targeted Plan–Do–Study–Act cycles and clinical audits",
      "Strengthen incident reporting and root-cause analysis follow-through",
    ];
  } else if (percent >= 50) {
    label = "Developing Quality Improvement";
    suggestions = [
      "Formalize standard operating procedures, assign process owners, and set measurable key performance indicators",
      "Launch staff training and competency checks for critical procedures",
    ];
  } else if (percent >= 25) {
    label = "Early Quality Improvement";
    suggestions = [
      "Establish a Quality Improvement committee and routine huddles",
      "Adopt baseline documentation including policies, pathways, and checklists",
      "Start monthly audits on patient safety and infection control",
    ];
  } else {
    label = "Needs Immediate Improvement";
    suggestions = [
      "Address patient safety risks urgently, including falls and medication errors",
      "Implement basic controls: hand hygiene, personal protective equipment, time-outs, and checklists",
      "Create a 90-day QI roadmap with leadership accountability",
    ];
  }
  // Gap-driven suggestions based on metric responses (ids not selected are gaps)
  try {
    const metrics = Array.isArray(opts?.metrics) ? opts.metrics : [];
    const selectedIds = Array.isArray(opts?.selectedIds) ? opts.selectedIds : [];
    if (metrics.length) {
      const gaps = metrics.filter(m => !selectedIds.includes(m.id));
      // Prioritize highest-impact gaps by points
      gaps.sort((a,b) => (Number(b.points)||0) - (Number(a.points)||0));
      const top = gaps.slice(0, Math.min(8, gaps.length));
      const gapSuggestions = top.map(m => {
        const name = String(m.name || "Metric");
        // General, organization-agnostic phrasing
        return `Establish and document: ${name} — define SOPs, train staff, and audit routinely`;
      });
      // Merge and de-duplicate while keeping band guidance first
      const seen = new Set();
      suggestions = suggestions.concat(gapSuggestions).filter(s => {
        const k = s.toLowerCase();
        if (seen.has(k)) return false; seen.add(k); return true;
      });
    }
  } catch {}
  return { label, percent, suggestions };
}

function getAssessmentByEmail(email, checklistId = null) {
  const assessments = getAssessments();
  const emailMatch = (a) => (a.email || "").toLowerCase() === String(email).toLowerCase();
  const list = assessments.filter(a => emailMatch(a) && (checklistId ? a.checklistId === checklistId : true));
  // return most recent if multiple
  return list.sort((a,b) => new Date(b.submittedAt||0) - new Date(a.submittedAt||0))[0] || null;
}

function getAssessmentsByEmail(email) {
  const assessments = getAssessments();
  return assessments.filter(a => (a.email || "").toLowerCase() === String(email).toLowerCase());
}

function updateAssessmentStatusById(id, status, adminNote = "") {
  const assessments = getAssessments();
  const idx = assessments.findIndex(a => a.id === id);
  if (idx === -1) return false;
  assessments[idx].status = status;
  assessments[idx].adminNote = String(adminNote || "");
  if (status === "approved") assessments[idx].verifiedAt = new Date().toISOString();
  saveAssessments(assessments);
  return true;
}

function generateReportText(assessment, verified) {
  const lines = [];
  const statusLabel = verified ? "VERIFIED AND APPROVED REPORT" : "UNVERIFIED SELF-ASSESSMENT REPORT";
  lines.push("QuXAT Compliance Report");
  lines.push("====================================");
  lines.push(`Status: ${statusLabel}`);
  lines.push(`Email: ${assessment.email}`);
  lines.push(`QSAS Score: ${assessment.score}`);
  lines.push(`Classification: ${assessment.classification || "-"} (${assessment.scorePercent ?? 0}%)`);
  lines.push(`Submitted At: ${assessment.submittedAt || "-"}`);
  lines.push(`Verified At: ${assessment.verifiedAt || "-"}`);
  if (assessment.adminNote) lines.push(`Admin Note: ${assessment.adminNote}`);
  if (Array.isArray(assessment.suggestions) && assessment.suggestions.length) {
    lines.push("\nSuggested Improvements:");
    assessment.suggestions.forEach(s => lines.push(`- ${s}`));
  }
  lines.push("\nSelected Metrics:");
  assessment.selectedMetrics.forEach(m => lines.push(`- ${m.name} (+${m.points})`));
  lines.push("\nNotes:");
  if (!verified) {
    lines.push("This report is generated by the user and is unverified.");
    lines.push("It is provided for self-assessment only and not an approval.");
  } else {
    lines.push("This report has been verified and approved by Admin.");
  }
  return lines.join("\n");
}

// -----------------------------
// Healthcare Quality Grid API
// -----------------------------
function getGridRegistrations() {
  ensureDefaults();
  try {
    const raw = localStorage.getItem(QSAS_KEYS.gridRegistrations) || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveGridRegistrations(list) {
  localStorage.setItem(QSAS_KEYS.gridRegistrations, JSON.stringify(Array.isArray(list) ? list : []));
}

// metricsAll: array of { id, name, points }
// selectedIds: array of ids
// details: { orgName, orgType, repName, repDesignation, email, achievements, consent }
function submitGridRegistration(metricsAll, selectedIds, details = {}) {
  const all = Array.isArray(metricsAll) ? metricsAll : [];
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  const perMetric = all.length ? (QSAS_MAX_SCORE / all.length) : 0;
  const selected = all.filter(m => ids.includes(m.id)).map(m => ({ id: m.id, name: m.name, points: perMetric }));
  const score = Math.round(selected.length * perMetric);
  const cls = classifyScore(score, QSAS_MAX_SCORE, { metrics: all, selectedIds: ids });
  const now = new Date().toISOString();
  function generateRegCode16() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  const payload = {
    id: generateId(),
    regCode: generateRegCode16(),
    email: String(details?.email || ""),
    orgName: String(details?.orgName || ""),
    orgType: String(details?.orgType || ""),
    orgCountry: String(details?.orgCountry || ""),
    orgState: String(details?.orgState || ""),
    orgDistrict: String(details?.orgDistrict || ""),
    orgCity: String(details?.orgCity || ""),
    repName: String(details?.repName || ""),
    repDesignation: String(details?.repDesignation || ""),
    consent: !!details?.consent,
    accreditations: Array.isArray(details?.accreditations) ? details.accreditations : [],
    qualityBadge: Array.isArray(details?.accreditations) && details.accreditations.length ? 'Accredited' : '',
    selectedMetrics: selected,
    score,
    scorePercent: cls.percent,
    classification: cls.label,
    suggestions: cls.suggestions,
    status: "pending",
    submittedAt: now,
    verifiedAt: null,
    adminNote: "",
  };
  const regs = getGridRegistrations();
  // replace existing by email if present
  const idx = regs.findIndex(r => (r.email || "").toLowerCase() === String(payload.email).toLowerCase());
  if (idx !== -1) regs[idx] = payload; else regs.push(payload);
  saveGridRegistrations(regs);
  return payload;
}

function updateGridRegistrationStatusById(id, status, adminNote = "") {
  const regs = getGridRegistrations();
  const idx = regs.findIndex(r => r.id === id);
  if (idx === -1) return false;
  regs[idx].status = status;
  regs[idx].adminNote = String(adminNote || "");
  if (status === "approved") regs[idx].verifiedAt = new Date().toISOString();
  saveGridRegistrations(regs);
  return true;
}

function getApprovedGridRegistrations() {
  return getGridRegistrations().filter(r => r.status === "approved");
}

function deleteGridRegistrationById(id) {
  const regs = getGridRegistrations();
  const next = regs.filter(r => r.id !== id);
  saveGridRegistrations(next);
  return true;
}
