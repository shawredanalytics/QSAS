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

    addBaselineIfMissing(
      "Industrial & Manufacturing - Fire Safety Preparedness Checklist",
      "Self assessment checklist to evaluate fire safety readiness across equipment, procedures, training, and emergency response.",
      "Industrial & Manufacturing",
      [
        { name: "Fire Risk Assessment performed and documented", points: 5 },
        { name: "Fire extinguishers available, accessible, and inspected (monthly)", points: 5 },
        { name: "Automatic sprinkler/hydrant systems operational with maintenance logs", points: 5 },
        { name: "Fire alarm and detection systems tested per schedule", points: 5 },
        { name: "Clearly marked emergency exits and illuminated exit signage", points: 5 },
        { name: "Evacuation route maps displayed at key locations", points: 5 },
        { name: "Periodic fire drills conducted with attendance and CAPA", points: 5 },
        { name: "Hot work permits enforced with fire watch and PPE", points: 5 },
        { name: "Combustible storage controls and housekeeping maintained", points: 5 },
        { name: "Electrical safety inspections to prevent overheating/overload", points: 5 },
        { name: "Designated muster points and headcount process", points: 5 },
        { name: "Trained Emergency Response Team with roles assigned", points: 5 }
      ]
    );

    // New: Foods & Consumables — Product-based Quality Checklists
    const milkId = addBaselineIfMissing(
      "Quality Check of Processed Milk",
      "Product-based checklist to assess processed milk quality as per food safety standards (pasteurization, composition, hygiene, packaging, labeling, and cold chain).",
      "Foods & Consumables",
      [
        { name: "Pasteurization time–temperature achieved and logged (e.g., 72°C/15s)", points: 10 },
        { name: "Phosphatase test negative (pasteurization effectiveness)", points: 10 },
        { name: "Fat% and SNF% within declared range; daily compositional tests", points: 10 },
        { name: "Microbiological limits (TPC, coliforms) within standard", points: 10 },
        { name: "Adulteration/contaminant screening (urea, starch, detergent) negative", points: 10 },
        { name: "CIP and equipment hygiene logs completed", points: 5 },
        { name: "Packaging integrity checks (seal, leaks) and visual inspection", points: 5 },
        { name: "Batch coding/traceability implemented; records maintained", points: 5 },
        { name: "Cold chain maintained: storage 2–4°C; dispatch temperature recorded", points: 10 },
        { name: "Labeling compliance (FSSAI license, net quantity, MRP, date)", points: 5 },
      ]
    );
    try {
      const map = JSON.parse(localStorage.getItem(QSAS_KEYS.metricsByChecklist) || "{}") || {};
      if (milkId && Array.isArray(map[milkId]) && map[milkId].length > 10) {
        map[milkId] = map[milkId].slice(0, 10);
        localStorage.setItem(QSAS_KEYS.metricsByChecklist, JSON.stringify(map));
      }
    } catch {}

    // New: Pharmacy & Pharmaceuticals — Quality of Purchased Medicine
    addBaselineIfMissing(
      "Quality Check of Purchased Medicine",
      "Customer checklist to verify the quality and compliance of a medicine obtained from a pharmacy store (packaging, labeling, prescription, storage, and traceability).",
      "Pharmacy & Pharmaceuticals",
      [
        { name: "Outer packaging intact; no tampering/damage", points: 5 },
        { name: "Expiry date clearly visible and valid", points: 10 },
        { name: "Batch/Lot number and manufacturing date present", points: 10 },
        { name: "Brand name, generic name, strength clearly labeled", points: 10 },
        { name: "MRP and regulatory license details visible", points: 5 },
        { name: "Schedule drug dispensed against valid prescription (if applicable)", points: 10 },
        { name: "Cold chain medicines provided in chilled pack with storage guidance", points: 10 },
        { name: "Tamper‑evident seal unbroken; strip/blister undamaged", points: 10 },
        { name: "Pharmacy bill issued with pharmacy details and item list", points: 10 },
        { name: "Adverse reaction reporting/info leaflet provided", points: 10 }
      ]
    );

    // New: Pharmacy & Pharmaceuticals — Quality Check of Pharmacy Products Provided by a Pharmacy
    addBaselineIfMissing(
      "Quality Check of Pharmacy Products Provided by a Pharmacy",
      "Self assessment to verify pharmacy product quality and compliance across packaging, labeling, prescription control, storage, traceability, and customer safety information.",
      "Pharmacy & Pharmaceuticals",
      [
        { name: "Outer packaging intact; tamper‑evident seals unbroken", points: 10 },
        { name: "Expiry date valid; manufacturing/batch details present", points: 10 },
        { name: "Brand/generic name, strength, dosage clearly labeled", points: 10 },
        { name: "MRP, license, and vendor details visible on bill/pack", points: 10 },
        { name: "Schedule drugs dispensed against valid prescription", points: 10 },
        { name: "Controlled substances record maintained per regulations", points: 10 },
        { name: "Cold chain/storage conditions maintained and logged", points: 10 },
        { name: "Recall/alerts monitored; suspect items quarantined", points: 10 },
        { name: "Customer counseling and adverse reaction info provided", points: 10 },
        { name: "Traceability: invoice, batch/lot retained for returns/complaints", points: 10 }
      ]
    );

    // New: Work Life Balance — Quality of Life Self Assessment
    addBaselineIfMissing(
      "Work Life Balance - Self Assessment",
      "Self assessment to reflect on and improve personal work-life balance across time, health, boundaries, and relationships.",
      "Work Life Balance",
      [
        { name: "Daily schedule includes planned breaks and recovery time", points: 10 },
        { name: "Average sleep duration and quality are adequate", points: 10 },
        { name: "Routine physical activity practiced weekly", points: 10 },
        { name: "Clear boundaries for work hours (start/end) maintained", points: 10 },
        { name: "Family/household time scheduled and honored", points: 10 },
        { name: "Meaningful social engagement with friends/community", points: 10 },
        { name: "Personal hobbies/creative pursuits practiced", points: 10 },
        { name: "Stress management tools used (breathing, journaling)", points: 10 },
        { name: "Digital detox practiced (limited screen time after hours)", points: 10 },
        { name: "Workload is fair; escalation process used when overloaded", points: 10 }
      ]
    );

    // New: Work Life Balance — Identify Workplace Toxicity (self assessment)
    addBaselineIfMissing(
      "Identify Workplace Toxicity (Self Assessment)",
      "Self assessment to identify toxic workplace behaviors and cultural risks impacting work-life balance and well-being.",
      "Work Life Balance",
      [
        { name: "Frequent disrespectful communication or bullying observed", points: 10 },
        { name: "Harassment policy awareness and reporting channels unclear", points: 10 },
        { name: "Retaliation fears prevent speaking up", points: 10 },
        { name: "Excessive workload/overtime with poor boundaries", points: 10 },
        { name: "Pay/promotion transparency lacking; perceived unfairness", points: 10 },
        { name: "Leadership accountability and feedback mechanisms weak", points: 10 },
        { name: "Psychological safety low; ideas dismissed frequently", points: 10 },
        { name: "Conflict resolution SOP absent or ineffective", points: 10 },
        { name: "Mental health support/EAP access unavailable or unknown", points: 10 },
        { name: "DEI practices weak; exclusionary behavior unchecked", points: 10 }
      ]
    );

    // New: Quality of Environment — Quality of Air to Breathe
    addBaselineIfMissing(
      "Quality of Air to Breathe",
      "Self assessment checklist to review indoor air quality factors for healthier living environments (PM levels, ventilation, filtration, humidity, and pollution controls).",
      "Quality of Environment",
      [
        { name: "Outdoor AQI checked daily; activity adjusted on poor days", points: 10 },
        { name: "Indoor PM2.5 below safe threshold (e.g., \u2264 35 \u00b5g/m\u00b3)", points: 10 },
        { name: "Indoor PM10 below safe threshold (e.g., \u2264 50 \u00b5g/m\u00b3)", points: 10 },
        { name: "CO2 levels generally \u2264 1000 ppm (adequate ventilation)", points: 10 },
        { name: "Relative humidity maintained between 30% and 60%", points: 10 },
        { name: "HEPA purifier present for key rooms; filters maintained", points: 10 },
        { name: "Windows/vents used to promote cross ventilation when feasible", points: 10 },
        { name: "No indoor smoking; incense/strong VOC sources minimized", points: 10 },
        { name: "Regular cleaning to control dust; damp/mold spots remediated", points: 10 },
        { name: "Kitchen/bath exhaust fans functional; pollutant sources controlled", points: 10 }
      ]
    );

    // New: Quality of Environment — Quality of Drinking Water
    addBaselineIfMissing(
      "Quality of Drinking Water",
      "Self assessment checklist to review drinking water safety and taste (source, filtration, testing, storage, and hygiene).",
      "Quality of Environment",
      [
        { name: "Source water clear; no unusual odor/taste", points: 10 },
        { name: "Periodic testing of TDS/pH/hardness (lab or kit)", points: 10 },
        { name: "TDS within desired range (e.g., 50–300 mg/L)", points: 10 },
        { name: "pH within 6.5–8.5", points: 10 },
        { name: "Microbial safety ensured (boiling/UV/RO) and spot tests", points: 10 },
        { name: "Filter cartridges replaced per schedule", points: 10 },
        { name: "RO/UV system serviced; remineralization considered for RO", points: 10 },
        { name: "Storage containers cleaned weekly and covered", points: 10 },
        { name: "Separate clean tap for drinking; avoid cross‑contamination", points: 10 },
        { name: "Delivery cans/bottles verified (sealed, vendor hygiene)", points: 10 }
      ]
    );

    // New: Quality of Environment — Compliance with Prevention & Control of Air Pollution Act, 1981
    addBaselineIfMissing(
      "Compliance with Prevention & Control of Air Pollution Act, 1981",
      "Self assessment to review organizational compliance with the Air (Prevention and Control of Pollution) Act, 1981 and related rules/guidelines.",
      "Quality of Environment",
      [
        { name: "Consent to Establish/Operate (CTE/CTO) obtained and valid", points: 10 },
        { name: "Emission sources inventoried; applicable standards identified", points: 10 },
        { name: "Stack/duct monitoring performed per schedule; reports filed", points: 10 },
        { name: "Ambient air monitoring conducted where mandated", points: 10 },
        { name: "Air pollution control equipment operated and maintained", points: 10 },
        { name: "Logs of APC equipment performance and maintenance kept", points: 10 },
        { name: "Fuel quality and usage records maintained (e.g., sulfur content)", points: 10 },
        { name: "Complaints/public grievances recorded and addressed", points: 10 },
        { name: "Regulatory reporting to SPCB/CPCB completed on time", points: 10 },
        { name: "Emergency response SOPs for air incidents; drills conducted", points: 10 }
      ]
    );

    // New: Quality of Climate Initiatives — Quality of Climate Policy adopted by an Industry
    addBaselineIfMissing(
      "Quality of Climate Policy adopted by an Industry",
      "Self assessment to evaluate an organization’s climate policy, governance, targets, disclosures, and implementation actions.",
      "Quality of Climate Initiatives",
      [
        { name: "Climate policy documented, approved, and disclosed", points: 10 },
        { name: "Governance: leadership accountability and roles defined", points: 10 },
        { name: "Targets: science‑based/sector‑aligned GHG reduction goals", points: 10 },
        { name: "Inventory: scope 1/2/3 mapped with baseline year", points: 10 },
        { name: "Action plan: energy efficiency and renewables roadmap", points: 10 },
        { name: "Adaptation/resilience measures documented (risk assessment)", points: 10 },
        { name: "Supplier/Value chain engagement on climate", points: 10 },
        { name: "Disclosures: periodic reporting (e.g., TCFD/CDP)", points: 10 },
        { name: "Training and awareness for employees", points: 10 },
        { name: "Review & improvement: annual management review of progress", points: 10 }
      ]
    );

    // New: Quality of Climate Initiatives — Industry compliance with EMS (ISO 14001)
    addBaselineIfMissing(
      "Industry compliance with Environmental Management System (EMS) - ISO 14001",
      "Self assessment to evaluate implementation of ISO 14001 EMS requirements across policy, planning, support, operation, performance evaluation, and improvement.",
      "Quality of Climate Initiatives",
      [
        { name: "Environmental policy approved, communicated, and reviewed", points: 10 },
        { name: "Environmental aspects/impacts identified; significant aspects controlled", points: 10 },
        { name: "Legal and other requirements identified and complied", points: 10 },
        { name: "Objectives and targets set; programs defined", points: 10 },
        { name: "Roles, responsibilities, and competence established", points: 10 },
        { name: "Awareness and communication processes implemented", points: 10 },
        { name: "Operational controls and emergency preparedness documented", points: 10 },
        { name: "Monitoring and measurement; internal audits performed", points: 10 },
        { name: "Nonconformity and corrective actions tracked", points: 10 },
        { name: "Management review conducted with actions and decisions", points: 10 }
      ]
    );

    // New: Communication Services — Compliance with ISO 9001 (Quality Management)
    addBaselineIfMissing(
      "Compliance of communication services with ISO 9001 (Quality Management)",
      "Self assessment for communication service providers to evaluate ISO 9001 QMS implementation across policy, processes, customer focus, performance evaluation, and improvement.",
      "Colleges & Universities",
      [
        { name: "Quality policy approved, communicated, and reviewed", points: 10 },
        { name: "Process map defined; inputs/outputs/owners documented", points: 10 },
        { name: "Customer requirements capture and satisfaction measurement", points: 10 },
        { name: "Documented procedures under control; records retained", points: 10 },
        { name: "Risk-based thinking implemented; actions tracked", points: 10 },
        { name: "Competence, awareness, and training maintained", points: 10 },
        { name: "Supplier/outsourced service controls evaluated", points: 10 },
        { name: "Monitoring, measurement, and KPIs for service quality", points: 10 },
        { name: "Internal audits conducted; CAPA effectiveness verified", points: 10 },
        { name: "Management review decisions and continual improvement", points: 10 }
      ]
    );

    addBaselineIfMissing(
      "How Safe was your recent Air Travel ?",
      "Passenger self assessment of safety behaviors and compliance during a recent air journey.",
      "Travel & Transportation",
      [
        { name: "Safety briefing attended and understood", points: 5 },
        { name: "Seat belt fastened during taxi, take‑off, and landing", points: 5 },
        { name: "Cabin baggage stowed correctly under seat/overhead", points: 5 },
        { name: "Exit row rules acknowledged (if allocated)", points: 5 },
        { name: "Compliance during turbulence seat‑belt ON", points: 5 },
        { name: "Followed crew instructions without delay", points: 5 },
        { name: "No hazardous or restricted items carried", points: 5 },
        { name: "Health protocols observed (mask/hand hygiene, if applicable)", points: 5 },
        { name: "Device usage complied with airplane mode notices", points: 5 },
        { name: "Aware of emergency exits and life vest location", points: 5 },
        { name: "Security screening completed without violations", points: 5 },
        { name: "Know how to report safety incidents to airline/authority", points: 5 }
      ]
    );

    addBaselineIfMissing(
      "How Safe is your Medical Diagnostic Laboratory ?",
      "Safety and quality readiness checklist for hospital-based medical diagnostic laboratories covering biosafety, QC/EQA, traceability, and emergency preparedness.",
      "Hospitals & Healthcare",
      [
        { name: "Internal QC documentation reviewed; corrective actions tracked", points: 10 },
        { name: "External proficiency testing (EQA/PT) participation results analyzed", points: 10 },
        { name: "Specimen chain-of-custody and labeling traceability ensured", points: 10 },
        { name: "Biohazard handling SOPs and PPE adherence monitored", points: 10 },
        { name: "Sharps safety program and exposure incident management", points: 10 },
        { name: "Cold chain storage/transport logs maintained", points: 10 },
        { name: "Analyzer calibration and preventive maintenance logs", points: 10 },
        { name: "Result validation SOPs and critical value reporting defined", points: 10 },
        { name: "LIS integrity, access controls, and data backup procedures", points: 10 },
        { name: "Emergency preparedness and spill response drills conducted", points: 10 },
      ]
    );

    // New: Infection Control Guidelines Compliance for Hospitals
    addBaselineIfMissing(
      "Hospital - Infection Control Guidelines Compliance",
      "Self assessment to evaluate compliance with standard infection control practices across hand hygiene, PPE, isolation, sterilization, cleaning, waste, surveillance, and training.",
      "Hospitals & Healthcare",
      [
        { name: "Hand hygiene program implemented with routine audits", points: 5 },
        { name: "PPE availability ensured; usage per risk level monitored", points: 5 },
        { name: "Isolation precautions (contact/droplet/airborne) applied", points: 5 },
        { name: "Sterilization monitoring (chemical/biological indicators) logged", points: 5 },
        { name: "High‑touch surface cleaning/disinfection schedule followed", points: 5 },
        { name: "Environmental cleaning SOPs and checklists in use", points: 5 },
        { name: "Central line bundle compliance recorded", points: 5 },
        { name: "Surgical site infection prevention bundle applied", points: 5 },
        { name: "Instrument reprocessing SOPs and tracking maintained", points: 5 },
        { name: "Biomedical waste segregation and disposal per rules", points: 5 },
        { name: "Needle‑stick injury reporting and post‑exposure management", points: 5 },
        { name: "HAI surveillance and outbreak reporting performed", points: 5 },
        { name: "Antimicrobial stewardship activities documented", points: 5 },
        { name: "Staff IPC training and competency checks completed", points: 5 },
        { name: "Patient/visitor IPC education materials displayed", points: 5 },
        { name: "Ventilation/air changes monitored in critical areas", points: 5 },
      ]
    );

    // New: Hospitals & Healthcare — Quality of Healthcare Services Provided by a Hospital
    addBaselineIfMissing(
      "Quality of Healthcare Services Provided by a Hospital",
      "Comprehensive self assessment of hospital service quality across patient safety, clinical effectiveness, patient experience, access and continuity.",
      "Hospitals & Healthcare",
      [
        { name: "Patient identification and consent processes consistently followed", points: 10 },
        { name: "Medication safety: reconciliation, labeling, high-alert protocols", points: 10 },
        { name: "Safe surgery checklist practiced (time‑out/briefing/debriefing)", points: 10 },
        { name: "Clinical documentation completeness and timeliness", points: 10 },
        { name: "Incident reporting, root‑cause analysis, CAPA tracking", points: 10 },
        { name: "Infection prevention: hand hygiene, isolation, sterilization", points: 10 },
        { name: "Emergency readiness: drills (code blue, fire), equipment checks", points: 10 },
        { name: "Access and continuity: appointment/bed management and referrals", points: 10 },
        { name: "Patient experience: feedback collection and service recovery", points: 10 },
        { name: "Outcome monitoring: readmission, LOS, adverse events", points: 10 }
      ]
    );

    // New: Hospitals & Healthcare — Quality of Diagnostic Services provided by a Diagnostic Lab
    addBaselineIfMissing(
      "Quality of Diagnostic Services provided by a Diagnostic Lab",
      "Self assessment of medical laboratory diagnostic service quality across specimen integrity, QC/EQA, report validation, turnaround time, data integrity, and customer service.",
      "Hospitals & Healthcare",
      [
        { name: "Specimen collection SOPs followed; ID verification documented", points: 10 },
        { name: "Specimen labeling traceability (two identifiers, time)", points: 10 },
        { name: "Specimen transport integrity; cold chain maintained where required", points: 10 },
        { name: "Internal QC recorded and reviewed; corrective actions documented", points: 10 },
        { name: "External quality assessment/proficiency testing participation", points: 10 },
        { name: "Equipment calibration and preventive maintenance up to date", points: 10 },
        { name: "Result validation SOPs; critical values communicated promptly", points: 10 },
        { name: "Turnaround time targets defined and met; delays analyzed", points: 10 },
        { name: "LIS/data integrity controls: access, backups, audit trails", points: 10 },
        { name: "Customer service: feedback capture, complaint resolution logs", points: 10 }
      ]
    );

    // New: Hospital Medical Tourism Readiness
    addBaselineIfMissing(
      "Hospital - Medical Tourism Readiness",
      "Self assessment checklist to evaluate a hospital’s preparedness to serve national and international medical tourism clientele across coordination, compliance, logistics, and follow‑up.",
      "Hospitals & Healthcare",
      [
        { name: "International Patient Desk established with coordinators", points: 5 },
        { name: "Visa support and invitation letter process defined", points: 5 },
        { name: "Language translation and interpretation services available", points: 5 },
        { name: "Transparent package pricing with inclusions/exclusions", points: 5 },
        { name: "Insurance/TPA onboarding and cashless arrangements in place", points: 5 },
        { name: "Accommodation and travel partner network established", points: 5 },
        { name: "Clinical pathways and fast‑track scheduling for electives", points: 5 },
        { name: "Emergency readiness and infection prevention protocols", points: 5 },
        { name: "Discharge planning with telemedicine follow‑up", points: 5 },
        { name: "Medical records sharing and data privacy/consent controls", points: 5 },
        { name: "Grievance redressal and feedback mechanisms", points: 5 },
        { name: "Staff training on international patient etiquette and SOPs", points: 5 },
        { name: "Airport pickup/transfer coordination SOPs", points: 5 },
        { name: "Risk management for international patient journey documented", points: 5 },
        { name: "Public web presence detailing packages and contact channels", points: 5 },
        { name: "Cultural sensitivity materials available for staff and patients", points: 5 },
      ]
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
  const cat = String((opts && opts.category) || "").trim();
  const qolCats = new Set(["Work Life Balance", "Quality of Environment"]);
  if (qolCats.has(cat)) {
    if (percent >= 85) {
      label = "Healthy & Balanced";
      suggestions = [
        "Sustain routines; track weekly trends and keep personal boundaries",
        "Share practices with family/community to reinforce habits",
      ];
    } else if (percent >= 70) {
      label = "Stable";
      suggestions = [
        "Strengthen weak areas with small daily actions (sleep, activity, detox)",
        "Schedule check-ins to keep momentum and avoid regressions",
      ];
    } else if (percent >= 50) {
      label = "Needs Improvement";
      suggestions = [
        "Pick 2–3 focus items; set realistic weekly goals and reminders",
        "Use simple tracking (journal/app) and reflect every weekend",
      ];
    } else if (percent >= 30) {
      label = "At Risk";
      suggestions = [
        "Address highest-impact gaps first (air/water quality, sleep)",
        "Ask for support; reduce toxic exposures and workload spikes",
      ];
    } else {
      label = "Critical Attention";
      suggestions = [
        "Start with safety basics; seek professional guidance if needed",
        "Create a 30-day recovery plan with daily micro-habits",
      ];
    }
  } else {
    if (cat === "QuXAT Quality Transformation") {
      if (percent >= 85) {
        label = "QMS Ready — Advanced";
        suggestions = [
          "Sustain documented processes; deepen data‑driven reviews",
          "Broaden supplier controls and optimize KPI dashboards",
        ];
      } else if (percent >= 70) {
        label = "QMS Ready — Solid";
        suggestions = [
          "Strengthen risk/opportunity actions and internal audit cadence",
          "Close documentation gaps and ensure record retention",
        ];
      } else if (percent >= 50) {
        label = "QMS Developing";
        suggestions = [
          "Define process owners and standard procedures",
          "Create KPI set; start monthly management reviews",
        ];
      } else if (percent >= 30) {
        label = "QMS Early";
        suggestions = [
          "Draft quality policy and minimum procedures",
          "Set up risk register and corrective action tracking",
        ];
      } else {
        label = "QMS Critical";
        suggestions = [
          "Establish basic document control and process maps",
          "Plan a 90‑day QMS activation with audits and reviews",
        ];
      }
    } else {
    // Product quality categories — consumer-friendly labeling
    if (cat === "Foods & Consumables") {
      if (percent >= 85) {
        label = "High Quality Product";
        suggestions = [
          "Maintain cold chain and check seals and batch coding",
          "Verify labeling: license, net quantity, MRP, packed-on date",
        ];
      } else if (percent >= 70) {
        label = "Good Quality Product";
        suggestions = [
          "Improve hygiene logs and compositional testing frequency",
          "Strengthen packaging integrity checks and traceability",
        ];
      } else if (percent >= 50) {
        label = "Acceptable Quality";
        suggestions = [
          "Address minor gaps: labeling completeness, leak checks, storage",
          "Add periodic microbial/adulteration screening",
        ];
      } else if (percent >= 30) {
        label = "Attention Needed";
        suggestions = [
          "Verify pasteurization/processing evidence and compositional ranges",
          "Avoid use if seals/dates are suspect; prefer verified sources",
        ];
      } else {
        label = "Unsafe — Do Not Use";
        suggestions = [
          "Discard and report; seek verified, sealed, in-date products",
          "Escalate to vendor/regulator for noncompliance",
        ];
      }
    } else if (cat === "Pharmacy & Pharmaceuticals") {
      if (percent >= 85) {
        label = "Safe & Compliant Medicine";
        suggestions = [
          "Keep receipts and batch details for traceability",
          "Follow storage guidance; track refill/expiry dates",
        ];
      } else if (percent >= 70) {
        label = "Compliant";
        suggestions = [
          "Ensure valid prescription for schedule drugs",
          "Verify seals and vendor hygiene more consistently",
        ];
      } else if (percent >= 50) {
        label = "Attention Needed";
        suggestions = [
          "Confirm batch/date info and labeling clarity",
          "Use trusted pharmacies; avoid damaged packaging",
        ];
      } else if (percent >= 30) {
        label = "Risk — Verify Prescription";
        suggestions = [
          "Avoid use until prescription and medicine details are verified",
          "Report suspected noncompliance to authority/vendor",
        ];
      } else {
        label = "Unsafe — Do Not Consume";
        suggestions = [
          "Do not consume; return and report to pharmacist/regulator",
          "Seek medical advice if already consumed",
        ];
      }
    } else if (cat === "Travel & Transportation") {
      if (percent >= 85) {
        label = "Highly Safe Travel";
        suggestions = [
          "Continue adherence to crew instructions and safety briefings",
          "Share good practices with fellow travelers",
        ];
      } else if (percent >= 70) {
        label = "Safe Travel";
        suggestions = [
          "Strengthen compliance during turbulence and exit-row rules",
          "Improve baggage stowage and situational awareness",
        ];
      } else if (percent >= 50) {
        label = "Moderately Safe";
        suggestions = [
          "Revisit safety briefing and seat-belt discipline",
          "Avoid restricted items and follow screening protocols",
        ];
      } else if (percent >= 30) {
        label = "Risky";
        suggestions = [
          "Prioritize seat-belt use and crew compliance",
          "Learn emergency exit locations and procedures",
        ];
      } else {
        label = "Unsafe";
        suggestions = [
          "Strictly follow safety guidance; seek assistance from crew",
          "Avoid behaviors that increase personal and public risk",
        ];
      }
    } else {
      // Healthcare Quality Improvement oriented bands (organizational)
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
    }
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
  return [];
}

function saveGridRegistrations(list) { return true; }

// metricsAll: array of { id, name, points }
// selectedIds: array of ids
// details: { orgName, orgType, repName, repDesignation, email, achievements, consent }
function submitGridRegistration(metricsAll, selectedIds, details = {}) { return {}; }

function updateGridRegistrationStatusById(id, status, adminNote = "") { return false; }

function getApprovedGridRegistrations() { return []; }

function deleteGridRegistrationById(id) { return false; }
function getCertIssuances() { return []; }

function saveCertIssuances(list) { return true; }

function addCertIssuance(rec) { return false; }
