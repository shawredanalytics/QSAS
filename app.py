import streamlit as st
import base64
from pathlib import Path
import json
import os
import requests
APP_VERSION = "3.1.0"

ROOT = Path(__file__).parent

# GitHub Gist fallback helpers defined early to avoid NameError when used below
def _github_gist_id():
    try:
        return str(st.secrets.get("GITHUB_GIST_ID") or os.environ.get("GITHUB_GIST_ID") or "")
    except Exception:
        return ""

def _gh_headers():
    tok = str(st.secrets.get("GITHUB_TOKEN") or os.environ.get("GITHUB_TOKEN") or "")
    h = {"Accept": "application/vnd.github+json"}
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h

def _github_get_gist_json(default=None):
    gid = _github_gist_id()
    if not gid:
        return default
    try:
        url = f"https://api.github.com/gists/{gid}"
        r = requests.get(url, headers=_gh_headers(), timeout=15)
        if r.status_code == 200:
            data = r.json()
            files = data.get("files") or {}
            file = files.get("grid_registrations.json") or next(iter(files.values()), None)
            if file and file.get("content"):
                return json.loads(file["content"])
        return default
    except Exception:
        return default

def _github_put_gist_json(payload: dict, filename: str = "grid_registrations.json"):
    gid = _github_gist_id()
    if not gid:
        return False, "no_gist"
    try:
        url = f"https://api.github.com/gists/{gid}"
        body = {"files": {filename: {"content": json.dumps(payload, ensure_ascii=False, indent=2)}}}
        r = requests.patch(url, headers=_gh_headers(), json=body, timeout=20)
        return (r.status_code in (200, 201)), r.status_code
    except Exception:
        return False, "exception"

def read_text(rel_path: str) -> str:
    p = ROOT / rel_path
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        return ""

def file_to_data_url(rel_path: str) -> str:
    p = ROOT / rel_path
    if not p.exists():
        return ""
    ext = p.suffix.lower()
    mime = {
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }.get(ext, "application/octet-stream")
    data = base64.b64encode(p.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"

def build_embedded_page(html_rel: str, bootstrap_js: str = ""):
    html = read_text(html_rel)
    css = read_text("assets/css/style.css")
    storage_js = read_text("assets/js/storage.js")
    branding_js = read_text("assets/js/branding.js")
    # Select the correct page script based on the HTML being embedded.
    # For index.html (Home), do not inject admin.js or user.js to avoid side effects.
    if "user.html" in html_rel:
        page_js = read_text("assets/js/user.js")
    elif "admin.html" in html_rel:
        page_js = read_text("assets/js/admin.js")
    elif "hq-admin.html" in html_rel:
        page_js = read_text("assets/js/hq-admin.js")
    else:
        page_js = ""
    # Assets mapping (include both encoded and unencoded key variants)
    assets_map = {
        "assets/QuXAT Logo Facebook.png": file_to_data_url("assets/QuXAT Logo Facebook.png"),
        "assets/QuXAT%20Logo%20Facebook.png": file_to_data_url("assets/QuXAT Logo Facebook.png"),
        "assets/QuXAT_Round_Seal.png": file_to_data_url("assets/QuXAT_Round_Seal.png"),
        "assets/Authorized Signatory.png": file_to_data_url("assets/Authorized Signatory.png"),
        "assets/Authorized%20Signatory.png": file_to_data_url("assets/Authorized Signatory.png"),
        "assets/img/quxat-logo.svg": file_to_data_url("assets/img/quxat-logo.svg"),
        "assets/Shawred Analytics Logo.png": file_to_data_url("assets/Shawred Analytics Logo.png"),
        "assets/Shawred%20Analytics%20Logo.png": file_to_data_url("assets/Shawred Analytics Logo.png"),
        "assets/Transparent Logo SAPLC.png": file_to_data_url("assets/Transparent Logo SAPLC.png"),
        "assets/Transparent%20Logo%20SAPLC.png": file_to_data_url("assets/Transparent Logo SAPLC.png"),
    }
    # Extract body content from original HTML
    lower = html.lower()
    start = lower.find("<body")
    if start != -1:
        start = lower.find(">", start) + 1
        end = lower.rfind("</body>")
        body = html[start:end] if end != -1 else html[start:]
    else:
        body = html
    # Inline asset references found in the body using data URLs so they render inside the embedded iframe
    try:
        for key, data_url in assets_map.items():
            if data_url:
                body = body.replace(key, data_url)
    except Exception:
        pass
    assets_js = f"<script>window.QSAS_ASSETS = {assets_map!r};</script>"
    ver = str(globals().get("APP_VERSION", os.environ.get("QSAS_VERSION") or "3"))
    version_js = f"<script>window.QSAS_VERSION = '{ver}';</script>"
    # Compose embedded HTML
    composed = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>QuXAT Embedded</title>
    <style>{css}</style>
    {assets_js}
    {version_js}
    {f"<script>{bootstrap_js}</script>" if bootstrap_js else ""}
    <script>{storage_js}</script>
    <script>{branding_js}</script>
  </head>
  <body>
    {body}
    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>
    <script>{page_js}</script>
  </body>
</html>
"""
    return composed

def _safe_embed(html_rel: str, height: int, scrolling: bool, bootstrap_js: str = ""):
    try:
        html = build_embedded_page(html_rel, bootstrap_js=bootstrap_js)
        st.components.v1.html(html, height=height, scrolling=scrolling)
    except Exception:
        try:
            st.error("Unable to load page. Please reload.")
            st.components.v1.html("<html><body><div>Loading…</div></body></html>", height=600, scrolling=True)
        except Exception:
            pass

def render_quxat_home():
    try:
        st.image("assets/QuXAT Logo Facebook.png", width=162)
    except Exception:
        pass
    try:
        with st.sidebar:
            if st.button("QuXAT Score — Healthcare", use_container_width=True, key="sb_home_btn"):
                _set_query_section("QuXAT Score Home")
                st.session_state["section"] = "QuXAT Score Home"
                try:
                    st.rerun()
                except Exception:
                    pass
            st.markdown(
                "<a href='/?section=Admin' style='display:block;background:#6a1b9a;color:#fff;text-align:center;padding:10px 12px;border-radius:10px;text-decoration:none;margin-top:12px'>QuXAT Score Admin</a>",
                unsafe_allow_html=True,
            )
    except Exception:
        pass
    st.markdown(
        """
        <div style="text-align:center;">
          <div style="font-size:2.0rem;font-weight:700;letter-spacing:.2px;">QuXAT Score — fast, credible, actionable</div>
          <div style="color:#6b778c;margin-top:6px;">Assess core quality and safety practices of a healthcare organization in minutes. See a clear score, understand the quality and safety maturity level of the healthcare organization, and act on targeted improvements.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown(
        """
        <style>
        .stButton>button{background:#ff2e71;color:#fff;border:1px solid #ff2e71;border-radius:8px}
        .stButton>button:hover{background:#ff4a84;border-color:#ff4a84}
        .qHero{background:linear-gradient(90deg,#fce7f3 0%,#e0f2fe 35%,#ecfccb 70%,#f5f3ff 100%);border:1px solid #e7ecf5;border-radius:12px;padding:22px;box-shadow:0 8px 22px rgba(10,46,90,.08) inset;margin-bottom:12px}
        .qRow{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:860px){.qRow{grid-template-columns:1fr}}
        .qCard{background:#fff;border:1px solid #e7ecf5;border-radius:12px;padding:14px;box-shadow:0 6px 18px rgba(10,46,90,.06)}
        .qIcon{font-size:22px;margin-right:8px}
        .qTitle{font-weight:600}
        .qSub{color:#6b778c}
        </style>
        """,
        unsafe_allow_html=True,
    )
    st.markdown(
        """
        <div class="qHero">
          <div style="text-align:center;font-weight:600;font-size:18px;margin-bottom:6px">Get a credible view of quality and safety maturity</div>
          <div style="text-align:center;color:#6b778c">Answer a concise checklist and see your QuXAT Score with guided actions</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    cta = st.button("Start Self Assessment", type="primary", use_container_width=True)
    if cta:
        _set_query_section("Self Assessment")
        st.session_state["section"] = "Self Assessment"
        try:
            st.rerun()
        except Exception:
            pass
    st.subheader("At a glance")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("<div class='qCard'><div class='qTitle'><span class='qIcon'>✅</span>Assess</div><div class='qSub'>Tick implemented practices across essential domains.</div></div>", unsafe_allow_html=True)
    with col2:
        st.markdown("<div class='qCard'><div class='qTitle'><span class='qIcon'>📊</span>Score</div><div class='qSub'>See a clear QuXAT Score with transparent classification.</div></div>", unsafe_allow_html=True)
    with col3:
        st.markdown("<div class='qCard'><div class='qTitle'><span class='qIcon'>🔧</span>Improve</div><div class='qSub'>Act on relevant suggestions and corrective actions.</div></div>", unsafe_allow_html=True)
    st.subheader("How it works")
    st.markdown("<div class='qRow'><div class='qCard'><div class='qTitle'>Practical metrics</div><div class='qSub'>Concise checklist focused on high‑impact processes.</div></div><div class='qCard'><div class='qTitle'>100‑point score</div><div class='qSub'>Each ‘Yes’ contributes equally; grouped into maturity bands.</div></div><div class='qCard'><div class='qTitle'>Guided actions</div><div class='qSub'>Unticked practices appear as suggestions with actions.</div></div></div>", unsafe_allow_html=True)
    st.subheader("Why it matters")
    st.markdown("<div class='qRow'><div class='qCard'><div class='qTitle'>Compliance readiness</div><div class='qSub'>Demonstrate evidence and audit‑readiness.</div></div><div class='qCard'><div class='qTitle'>Operational safety</div><div class='qSub'>Reduce risk by strengthening safety‑critical practices.</div></div><div class='qCard'><div class='qTitle'>Continuous improvement</div><div class='qSub'>Track progress over time and sustain improvements.</div></div></div>", unsafe_allow_html=True)
    st.markdown("<div class='qRow'>"
                "<div class='qCard'><div class='qTitle'>Medical Tourism</div><div class='qSub'>Attract international patients with credible quality indicators.</div></div>"
                "<div class='qCard'><div class='qTitle'>International Benchmarking</div><div class='qSub'>Benchmark services against recognized global practices.</div></div>"
                "<div class='qCard'><div class='qTitle'>Credit Worthiness</div><div class='qSub'>Demonstrable maturity to support lender and investor confidence.</div></div>"
                "</div>", unsafe_allow_html=True)
    st.markdown("<div class='qRow'>"
                "<div class='qCard'><div class='qTitle'>Public Reputation & Recognition</div><div class='qSub'>Earn trust and recognition in the community and industry.</div></div>"
                "</div>", unsafe_allow_html=True)

    st.subheader("Who benefits")
    st.markdown("<div class='qRow'>"
                "<div class='qCard'><div class='qTitle'>Hospitals</div><div class='qSub'>Multi‑specialty, tertiary care and day‑care centers</div></div>"
                "<div class='qCard'><div class='qTitle'>Diagnostic Laboratories</div><div class='qSub'>Pathology, biochemistry, microbiology, molecular</div></div>"
                "<div class='qCard'><div class='qTitle'>Imaging Centers</div><div class='qSub'>CT, MRI, X‑ray, ultrasound and nuclear medicine</div></div>"
                "</div>", unsafe_allow_html=True)
    st.markdown("<div class='qRow'>"
                "<div class='qCard'><div class='qTitle'>Clinics</div><div class='qSub'>Out‑patient and specialty clinics</div></div>"
                "<div class='qCard'><div class='qTitle'>Eye Hospitals</div><div class='qSub'>Ophthalmology hospitals and vision centers</div></div>"
                "<div class='qCard'><div class='qTitle'>Medical Colleges</div><div class='qSub'>Teaching hospitals and academic departments</div></div>"
                "</div>", unsafe_allow_html=True)
    st.markdown("<div class='qRow'>"
                "<div class='qCard'><div class='qTitle'>Blood Banks</div><div class='qSub'>Collection, processing and transfusion services</div></div>"
                "<div class='qCard'><div class='qTitle'>Dental & Day‑Surgery</div><div class='qSub'>Dental clinics and ambulatory care centers</div></div>"
                "<div class='qCard'><div class='qTitle'>Home Health</div><div class='qSub'>Home care, nursing and tele‑health providers</div></div>"
                "</div>", unsafe_allow_html=True)

    st.subheader("Clients")
    clients_data = [
        ("Apollo Hospitals - Kakinada", "Kakinada", "Andhra Pradesh"),
        ("Gayathri Vidya Parishad – Medical College", "Visakhapatnam", "Andhra Pradesh"),
        ("Satya Scans & Diagnostics", "Kakinada", "Andhra Pradesh"),
        ("Aparna Hospital and Scan Centre", "Nalgonda", "Telangana"),
        ("Dolphin Diagnostic Services", "Visakhapatnam", "Andhra Pradesh"),
        ("Orange Diagnostics", "Vijayawada", "Andhra Pradesh"),
        ("Quality Care Lab", "Kakinada", "Andhra Pradesh"),
        ("Satya Scans & Diagnostics", "Rajahmundry", "Andhra Pradesh"),
        ("RK Scans & Diagnostics", "Guntur", "Andhra Pradesh"),
        ("Viltis Diagnostics", "Tirupati", "Andhra Pradesh"),
        ("Dr Raghu Diagnostic Centre", "Vizianagaram", "Andhra Pradesh"),
        ("Star Prime Diagnostic Laboratory", "Visakhapatnam", "Andhra Pradesh"),
        ("Siddhartha Medical College", "Vijayawada", "Andhra Pradesh"),
        ("Shraddha Global Hospital", "Hyderabad", "Telangana"),
        ("Surya Diagnostics", "Hyderabad", "Telangana"),
        ("Sai Vijaya Diagnostics", "Ongole", "Andhra Pradesh"),
        ("Reliance Gadimoga – Health Centre", "Kakinada", "Andhra Pradesh"),
        ("Sigma Diagnostics", "Hyderabad", "Telangana"),
        ("Apple Scans & Diagnostics", "Ongole", "Andhra Pradesh"),
        ("Swathi Imaging & Diagnostics", "Kakinada", "Andhra Pradesh"),
        ("Refracto Eye Hospital", "Nizamabad", "Telangana"),
        ("Refracto Eye Hospital", "Suchitra, Hyderabad", "Telangana"),
        ("AMRL Diagnostic Laboratory", "Srinagar", "Jammu & Kashmir"),
        ("KIMS Hospitals", "Ananthapur & Visakhapatnam", "Andhra Pradesh"),
        ("Medithics Diagnostic Laboratory", "Kolkata", "West Bengal"),
        ("Vision Hospitals", "Kakinada", "Andhra Pradesh"),
        ("Apollo Hospitals - Kakinada", "Kakinada", "Andhra Pradesh"),
        ("Shraddha Global – Diagnostic Laboratory", "Hyderabad", "Telangana"),
        ("Gospel Diagnostics", "Guntur", "Andhra Pradesh"),
        ("Aswini Diagnostics", "Vijayawada", "Andhra Pradesh"),
        ("AIMS Hospital", "Ongole", "Andhra Pradesh"),
        ("Sunshine Diagnostics", "Kadapa", "Andhra Pradesh"),
        ("NIMRA Medical College Hospital", "Vijayawada", "Andhra Pradesh"),
        ("Star Prime Diagnostic Laboratory", "MVP Colony, Visakhapatnam", "Andhra Pradesh"),
        ("Unoclinix Diagnostic Laboratory", "Visakhapatnam", "Andhra Pradesh"),
        ("Fastmed Diagnostics", "Visakhapatnam", "Andhra Pradesh"),
        ("Dr. Elite Diagnostic Laboratory", "Gopalpatnam, Visakhapatnam", "Andhra Pradesh"),
        ("Dr. Elite Diagnostic Laboratory", "Dwarakanagar, Visakhapatnam", "Andhra Pradesh"),
        ("Dr. Elite Diagnostic Laboratory", "Maharanipeta, Visakhapatnam", "Andhra Pradesh"),
        ("Dr. Elite Diagnostic Laboratory", "Anakapalli, Visakhapatnam", "Andhra Pradesh"),
        ("Eyecon Care Hospital", "Vijayawada", "Andhra Pradesh"),
        ("Galla Group of Hospitals", "Tirupati", "Andhra Pradesh"),
        ("Rohini Diagnostic Laboratory", "Rajahmundry", "Andhra Pradesh"),
        ("Dolphin Diagnostic Services – Khammam", "Khammam", "Telangana"),
        ("Sreelatha Hospital", "Nalgonda", "Telangana"),
        ("Refracto Eye Hospital", "Kondapur, Hyderabad", "Telangana"),
    ]
    # Group by state for neat ordering and color coding
    color_by_state = {
        "Andhra Pradesh": "#e9fff3",
        "Telangana": "#fce7f3",
        "West Bengal": "#fff7ed",
        "Jammu & Kashmir": "#f5f3ff",
    }
    groups = {}
    for name, city, state in clients_data:
        groups.setdefault(state, []).append((name, city))
    # Render groups in a consistent order
    order = ["Andhra Pradesh", "Telangana", "West Bengal", "Jammu & Kashmir"]
    for state in order:
        items = sorted(groups.get(state, []), key=lambda x: (x[0], x[1]))
        if not items:
            continue
        st.markdown(f"<div class='qTitle' style='margin-top:8px'>{state}</div>", unsafe_allow_html=True)
        chips = []
        bg = color_by_state.get(state, "#eef3ff")
        for (name, city) in items:
            chips.append(f"<span class='pill' style='background:{bg};margin:4px 6px;display:inline-block'>{name} — {city}</span>")
        st.markdown("<div style='display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start'>" + "".join(chips) + "</div>", unsafe_allow_html=True)

def render_self_assessment():
    try:
        st.image("assets/QuXAT Logo Facebook.png", width=162)
    except Exception:
        pass
    try:
        with st.sidebar:
            if st.button("QuXAT Score — Healthcare", use_container_width=True, key="sb_home_btn_sa"):
                _set_query_section("QuXAT Score Home")
                st.session_state["section"] = "QuXAT Score Home"
                try:
                    st.rerun()
                except Exception:
                    pass
            st.markdown(
                "<a href='/?section=Admin' style='display:block;background:#6a1b9a;color:#fff;text-align:center;padding:10px 12px;border-radius:10px;text-decoration:none;margin-top:12px'>QuXAT Score Admin</a>",
                unsafe_allow_html=True,
            )
    except Exception:
        pass
    st.markdown("""
    <style>
    .stButton>button{background:#ff2e71;color:#fff;border:1px solid #ff2e71;border-radius:10px}
    .stButton>button:hover{background:#ff4a84;border-color:#ff4a84}
    .saCard{background:#ffffff;border:1px solid #e7ecf5;border-radius:16px;padding:18px;box-shadow:0 8px 22px rgba(10,46,90,.06);margin-bottom:12px;transition:box-shadow .12s ease}
    .saCard:hover{box-shadow:0 12px 28px rgba(10,46,90,.10)}
    .saGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    @media(max-width:860px){.saGrid{grid-template-columns:1fr}}
    .pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef3ff;border:1px solid #e7ecf5}
    .pill:hover{background:#e6efff}
    .scoreVal{font-size:2rem;font-weight:700;color:#1f5eea}
    .badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#f1f5f9;border:1px solid #e7ecf5;margin-left:6px}
    .badge-exemplary{background:#e9fff3;border-color:#c7f3dd}
    .badge-strong{background:#fce7f3;border-color:#f7c2d8}
    .badge-developing{background:#fff7ed;border-color:#fde5c7}
    .badge-early{background:#eef3ff;border-color:#dbe4ff}
    .badge-needs-improvement{background:#f5f3ff;border-color:#e5e3ff}
    </style>
    """, unsafe_allow_html=True)
    st.markdown("<div style='text-align:center;font-size:1.6rem;font-weight:700'>QuXAT Score (Healthcare) — Organizational Self Assessment</div>", unsafe_allow_html=True)
    st.markdown("<div style='text-align:center;color:#6b778c;margin-bottom:8px'>Tick implemented practices and see your score with guided actions</div>", unsafe_allow_html=True)
    items = [
        "Quality Policy approved, communicated, and reviewed",
        "QMS scope defined; context of the organization documented",
        "Process map with inputs/outputs, owners, and interactions",
        "Documented procedures and records under control",
        "Risk‑based thinking implemented (risk register and actions)",
        "Competence, awareness, and training records maintained",
        "Customer requirements handling and satisfaction measurement",
        "Supplier/outsourced process controls and evaluations",
        "Monitoring and measurement of process performance (KPIs)",
        "Internal audit program executed with findings and CAPA",
        "Management review performed with decisions and actions",
        "Nonconformity and corrective action procedure practiced",
    ]
    cols = st.columns(3)
    for i, text in enumerate(items):
        col = cols[i % 3]
        with col:
            st.checkbox(text, key=f"sa_{i}")
    selected = sum(1 for i in range(len(items)) if st.session_state.get(f"sa_{i}", False))
    score = round((selected / len(items)) * 100) if items else 0
    if score >= 90:
        label = "Exemplary"
    elif score >= 75:
        label = "Strong"
    elif score >= 50:
        label = "Developing"
    elif score >= 25:
        label = "Early"
    else:
        label = "Needs Immediate Improvement"
    st.markdown(
        f"<div class='saCard'>"
        f"<div class='scoreVal'>{score} / 100<span class='badge'>{label} ({score}%)</span></div>"
        f"<div style='color:#6b778c'>Selected practices: {selected} of {len(items)}</div>"
        f"<div style='margin-top:8px;color:#6b778c'>For Advisory Support and clarification regarding the QuXAT Scoring Methodology — Contact the Advisory Team on WhatsApp Support @ +91 6301237212. "
        f"<a href='https://wa.me/916301237212?text=Hello%20QuXAT%20Advisory%20Team%2C%20please%20assist%20with%20QSAS%20scoring%20clarifications.' target='_blank'>Open WhatsApp</a></div>"
        f"</div>",
        unsafe_allow_html=True,
    )
    # Status card: Show QuXAT Score and classification clearly
    status_desc = (
        "Well‑established quality and safety practices with continual improvement." if score >= 90 else
        "Strong systems in place; focus on audits and PDSA cycles to close minor gaps." if score >= 75 else
        "Developing stage — formalize procedures, owners and KPIs with regular reviews." if score >= 50 else
        "Early stage — establish governance, documentation and routine audits." if score >= 25 else
        "Immediate improvement required — address safety‑critical gaps and define a 90‑day plan."
    )
    st.markdown(
        f"<div class='saCard'><div class='qTitle'>QuXAT Score Status</div>"
        f"<div style='margin-top:6px'>Your QuXAT Score: <strong>{score}/100</strong> — Classification: <span class='badge'>{label}</span></div>"
        f"<div style='margin-top:6px;color:#6b778c'>{status_desc}</div></div>",
        unsafe_allow_html=True,
    )
    # Classification guide for users
    st.markdown(
        """
        <div class='saCard'>
          <div class='qTitle'>Classification Guide</div>
          <div class='saGrid' style='margin-top:8px'>
            <div><span class='pill' style='background:#e9fff3'>Exemplary</span><div style='margin-top:6px;color:#6b778c'>Score ≥ 90</div></div>
            <div><span class='pill' style='background:#fce7f3'>Strong</span><div style='margin-top:6px;color:#6b778c'>Score ≥ 75</div></div>
            <div><span class='pill' style='background:#fff7ed'>Developing</span><div style='margin-top:6px;color:#6b778c'>Score ≥ 50</div></div>
          </div>
          <div class='saGrid' style='margin-top:8px'>
            <div><span class='pill' style='background:#eef3ff'>Early</span><div style='margin-top:6px;color:#6b778c'>Score ≥ 25</div></div>
            <div><span class='pill' style='background:#f5f3ff'>Needs Immediate Improvement</span><div style='margin-top:6px;color:#6b778c'>Score &lt; 25</div></div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    missing = [items[i] for i in range(len(items)) if not st.session_state.get(f"sa_{i}", False)]
    interp = (
        "Maintain standardization, periodic audits, and continuous improvement cycles." if score >= 90 else
        "Target improvements via internal audits and PDSA cycles; close minor gaps." if score >= 75 else
        "Formalize procedures, assign process owners, and define KPIs with reviews." if score >= 50 else
        "Establish governance, documentation, and routine audits to build a baseline." if score >= 25 else
        "Address safety‑critical gaps immediately and implement a 90‑day remediation plan."
    )
    st.markdown("<div class='saCard'>", unsafe_allow_html=True)
    in_cols = st.columns(2)
    with in_cols[0]:
        org = st.text_input("Healthcare Organization Name", value=st.session_state.get("sa_org", ""), key="sa_org")
    with in_cols[1]:
        email = st.text_input("Designated Email", value=st.session_state.get("sa_email", ""), key="sa_email")
    st.markdown("</div>", unsafe_allow_html=True)

    phone = "916301237212"
    msg = (
        f"Request for Verified Certificate\n"
        f"Healthcare Organization: {org or '-'}\n"
        f"Email: {email or '-'}\n"
        f"QuXAT Score: {score}/100 ({label})\n"
        f"Selected practices: {selected}/{len(items)}\n"
        f"Please assist with verification."
    )
    from urllib.parse import quote
    wa_url = f"https://wa.me/{phone}?text=" + quote(msg)

    # QuXAT Score Card with logo and unique ID + download button
    from datetime import datetime
    now = datetime.now()
    id_digits = now.strftime('%Y%m%d%H%M%S')
    suffix = chr(65 + (now.microsecond % 26)) + chr(65 + ((now.microsecond // 26) % 26))
    score_id = id_digits + suffix  # 16-char alphanumeric
    logo_b64 = ''
    try:
        with open('assets/QuXAT Logo Facebook.png', 'rb') as lf:
            import base64 as _b64
            logo_b64 = _b64.b64encode(lf.read()).decode('ascii')
    except Exception:
        logo_b64 = ''
    card_html = f"""
    <!doctype html>
    <html><head><meta charset='utf-8'><title>QuXAT Score Card</title>
    <style>
    body{{font-family:Arial,Segoe UI,system-ui; color:#0f172a; margin:24px}}
    .wrap{{border:1px solid #e7ecf5; border-radius:12px; padding:16px; box-shadow:0 6px 18px rgba(10,46,90,.06)}}
    .head{{display:flex; align-items:center; gap:12px;}}
    .logo{{height:48px}}
    .title{{font-weight:700; font-size:18px}}
    .row{{margin-top:8px}}
    .badge{{display:inline-block; padding:4px 8px; border-radius:999px; background:#f1f5f9; border:1px solid #e7ecf5}}
    </style></head><body>
    <div class='wrap'>
      <div class='head'>
        {('<img class="logo" src="data:image/png;base64,' + logo_b64 + '"/>') if logo_b64 else ''}
        <div class='title'>QuXAT Self Assessment Score Card</div>
      </div>
      <div class='row'><strong>Score ID:</strong> {score_id}</div>
      <div class='row'><strong>Healthcare Organization:</strong> {org or '-'} &nbsp; | &nbsp; <strong>Email:</strong> {email or '-'}</div>
      <div class='row'><strong>Date:</strong> {now.strftime('%Y-%m-%d %H:%M:%S')}</div>
      <div class='row'><strong>Score:</strong> {score}/100 &nbsp; | &nbsp; <strong>Classification:</strong> <span class='badge'>{label}</span></div>
      <div class='row'><strong>Selected Practices:</strong> {selected} of {len(items)}</div>
    </div>
    </body></html>
    """
    valid_email = bool(email and "@" in email and "." in email)
    if not (org and org.strip()) or not valid_email:
        st.warning("Enter Healthcare Organization Name and a valid Email to enable score card download.")
        enable_download = False
    else:
        enable_download = True

    clicked = False
    if enable_download:
        clicked = st.download_button(
            label="Download QuXAT Score Card",
            data=card_html.encode('utf-8'),
            file_name=f"quxat_score_card_{score_id}.html",
            mime="text/html",
            use_container_width=True,
        )

    if clicked:
        _append_admin_record("downloaded_score_card")
        try:
            import smtplib, ssl
            from email.message import EmailMessage
            smtp_host = os.environ.get("SMTP_HOST", "")
            smtp_port = int(os.environ.get("SMTP_PORT", "0") or 0)
            smtp_user = os.environ.get("SMTP_USER", "")
            smtp_pass = os.environ.get("SMTP_PASS", "")
            msg = EmailMessage()
            msg["Subject"] = f"QuXAT Score Card Generated — {score_id}"
            msg["From"] = smtp_user or "no-reply@quxat.com"
            msg["To"] = "quxat.team@gmail.com"
            body = (
                f"QuXAT Score Card Generated\n\n"
                f"Score ID: {score_id}\n"
                f"Healthcare Organization: {org}\n"
                f"Email: {email}\n"
                f"Score: {score}/100 ({label})\n"
                f"Selected practices: {selected}/{len(items)}\n"
                f"Date: {now.strftime('%Y-%m-%d %H:%M:%S')}\n"
            )
            msg.set_content(body)
            if smtp_host and smtp_port and smtp_user and smtp_pass:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
                st.success("Score card details emailed to the advisory team.")
            else:
                st.info("Email server not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment to enable auto email.")
        except Exception:
            st.warning("Could not send email automatically. Please ensure SMTP settings are configured.")

        try:
            wa_msg = (
                f"QuXAT Score Card Generated%0AID: {score_id}%0AHealthcare Organization: {quote(org)}%0AEmail: {quote(email)}%0AScore: {score}/100 ({label})"
            )
            wa_link = f"https://wa.me/916301237212?text={wa_msg}"
            st.markdown(f"[Notify Advisory Team on WhatsApp]({wa_link})")
        except Exception:
            pass

    st.markdown(
        f"<div class='saCard'><div class='saGrid'>"
        f"<div><div class='pill'>Guidance</div><div style='margin-top:6px'>{interp}</div></div>"
        f"<div><div class='pill'>Top gaps</div><div style='margin-top:6px'>{'<br>'.join(missing[:6]) if missing else 'None'}</div></div>"
        f"</div></div>",
        unsafe_allow_html=True,
    )

    if st.button("Register for Verified Certificate", type="primary", use_container_width=True):
        valid_email = bool(email and "@" in email and "." in email)
        if not (org and org.strip()) or not valid_email:
            st.warning("Please enter Healthcare Organization Name and a valid Designated Email to proceed with verification.")
        else:
            st.success("Preparing WhatsApp message…")
            st.markdown(f"[Open WhatsApp to message the advisory team]({wa_url})")
            _append_admin_record("requested_verification")
    st.markdown("<div style='margin-top:12px'></div>", unsafe_allow_html=True)
    if st.button("Return to QuXAT Score — Healthcare (Home Page)", type="primary", use_container_width=True, key="sa_home_bottom"):
        _set_query_section("QuXAT Score Home")
        st.session_state["section"] = "QuXAT Score Home"
        try:
            st.rerun()
        except Exception:
            pass

def render_admin():
    try:
        st.image("assets/QuXAT Logo Facebook.png", width=162)
    except Exception:
        pass
    st.subheader("QuXAT Score Admin")
    user = st.text_input("Admin Login", value="", placeholder="Admin")
    pwd = st.text_input("Password", value="", type="password", placeholder="QuXAT123")
    proceed = st.button("Sign In", type="primary")
    if proceed:
        if (user.strip().lower() == "admin" or user.strip() == "Admin") and pwd == "QuXAT123":
            st.session_state["admin_logged"] = True
            st.success("Admin access granted.")
        else:
            st.error("Invalid credentials.")
    if st.session_state.get("admin_logged"):
        st.markdown("<div class='saCard'><div class='qTitle'>Organizations — Downloads & Verification Requests</div></div>", unsafe_allow_html=True)
        try:
            fp = Path("data") / "admin_records.json"
            if fp.exists():
                with fp.open("r", encoding="utf-8") as f:
                    recs = json.load(f)
            else:
                recs = []
        except Exception:
            recs = []
        if recs:
            downloaded = [r for r in recs if r.get("action") == "downloaded_score_card"]
            requested = [r for r in recs if r.get("action") == "requested_verification"]
            st.write("Downloaded QuXAT Score Cards")
            st.table([{ "Score ID": r.get("score_id"), "Healthcare Organization": r.get("org"), "Email": r.get("email"), "Score": r.get("score"), "Classification": r.get("label"), "When": r.get("ts") } for r in downloaded])
            st.write("Applied for Verified Certificate")
            st.table([{ "Score ID": r.get("score_id"), "Healthcare Organization": r.get("org"), "Email": r.get("email"), "Score": r.get("score"), "Classification": r.get("label"), "When": r.get("ts") } for r in requested])
        else:
            st.info("No records yet.")
    

st.set_page_config(page_title="QuXAT Healthcare Organization Self Assessment", layout="wide", initial_sidebar_state="expanded")

# Hide Streamlit's default 3-dots app menu on the top-right
st.markdown(
    """
    <style>
    button[title="View app menu"] { display: none !important; visibility: hidden !important; }
    #MainMenu { display: none !important; visibility: hidden !important; }
    button[aria-label*="feedback"], button[title*="feedback"] { display: none !important; visibility: hidden !important; }
    a[href*="streamlit.app"], a[href*="streamlit.io"] { display: none !important; visibility: hidden !important; }
    /* Hide specific Streamlit toolbar actions, keep sidebar toggle visible */
    button[title*="Fork"], button[aria-label*="Fork"],
    button[title*="Deploy"], button[aria-label*="Deploy"],
    button[title*="Rerun"], button[aria-label*="Rerun"] {
      display: none !important; visibility: hidden !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Query param helpers to support end-to-end navigation from embedded pages
def _get_query_params():
    try:
        # Streamlit >=1.34
        return dict(st.query_params)
    except Exception:
        try:
            return st.experimental_get_query_params()
        except Exception:
            return {}

def _sync_section_from_query():
    qp = _get_query_params()
    if not qp:
        return
    val = qp.get("section")
    if isinstance(val, list):
        val = val[0] if val else None
    if isinstance(val, str) and val:
        # Normalize URL-encoded variants: treat '+' as space for manual links
        try:
            normalized = val.replace('+', ' ').strip()
        except Exception:
            normalized = val
        st.session_state["section"] = normalized

def _set_query_section(value: str):
    try:
        try:
            st.query_params.clear()
        except Exception:
            pass
        st.query_params["section"] = value
    except Exception:
        try:
            st.experimental_set_query_params(section=value)
        except Exception:
            pass

def _no_persist_bootstrap_js() -> str:
    return """
    (function(){
      try {
        try { window.localStorage && window.localStorage.clear && window.localStorage.clear(); } catch(e){}
        var __mem = {};
        if (window.localStorage) {
          window.localStorage.setItem = function(k,v){ __mem[String(k)] = String(v); };
          window.localStorage.getItem = function(k){ return Object.prototype.hasOwnProperty.call(__mem,String(k)) ? __mem[String(k)] : null; };
          window.localStorage.removeItem = function(k){ delete __mem[String(k)]; };
          window.localStorage.clear = function(){ __mem = {}; };
        }
      } catch(e){}
    })();
    """

# Sidebar: render navigation buttons for Home and Admin
def render_sidebar_once():
    # Initialize section
    if "section" not in st.session_state:
        st.session_state["section"] = "QuXAT Score Home"

    with st.sidebar:
        st.subheader("Navigation")
        try:
            st.caption(f"QSAS Portal v{globals().get('APP_VERSION', '3')}")
        except Exception:
            st.caption("QSAS Portal v3")
        # Primary navigation
        quxat_score = st.button("QuXAT Score", type="primary", use_container_width=True)
        if quxat_score:
            _set_query_section("QuXAT Score Home")
            st.session_state["section"] = "QuXAT Score Home"
            try:
                st.rerun()
            except Exception:
                pass


        # Visual separation, admin actions moved to the bottom area
        try:
            st.divider()
        except Exception:
            st.markdown("<hr>", unsafe_allow_html=True)

        # Admin and Reports buttons removed

    # Organizational page removed
    # Transform page removed
    # Admin removed
    # Reports removed
    # removed Product based Quality Check navigation

_sync_section_from_query()
if "section" not in st.session_state:
    st.session_state["section"] = "QuXAT Score Home"
section = st.session_state.get("section", "Home")
# Redirect removed pages to Home
if section in ("Healthcare Quality Grid", "Register for the Healthcare Quality Grid"):
    section = "Home"
mode = "Inline assets (Cloud)"
admin_username = st.session_state.get("admin_username", "")
admin_password = st.session_state.get("admin_password", "")
admin_auto_login = bool(st.session_state.get("admin_auto_login", False))

def build_home_html():
    css = read_text("assets/css/style.css")
    # Explicitly use the QuXAT Facebook PNG logo on the Home page
    logo_src = file_to_data_url("assets/QuXAT Logo Facebook.png")
    html = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>QuXAT Self Assessment</title>
    <style>{css}</style>
  </head>
  <body>
    <img class=\"brand-logo\" alt=\"QuXAT\" src=\"{logo_src}\" style=\"display:block; margin:0 auto; height:120px;\" />
  </body>
</html>
"""
    return html

def build_home_hero_html():
    css = read_text("assets/css/style.css")
    html = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <style>{css}</style>
  </head>
  <body>
    <div class=\"container\">
      <div class=\"card hero-card\"> 
        <h2>QuXAT Self‑Assessment Score (QSAS) — simple, credible, and actionable</h2>
        <p class=\"hint\">QSAS helps healthcare organizations in India self‑assess core quality practices, instantly view a Quality Self‑Assessment Score, and receive tailored guidance to improve. When ready, submit for Admin verification to receive a certified certificate.</p>
        <ul class=\"list\" style=\"margin-top:12px;\"> 
          <li><span class=\"item-title\">Quick</span><span class=\"item-sub\">Complete in minutes with clear, practical metrics.</span></li>
          <li><span class=\"item-title\">Actionable</span><span class=\"item-sub\">Immediate score and suggestions mapped to your maturity.</span></li>
          <li><span class=\"item-title\">Credible</span><span class=\"item-sub\">Optional Admin verification for a certified certificate.</span></li>
        </ul>
      </div>

      <div class=\"card\"> 
        <h3>Why QSAS for India?</h3>
        <ul class=\"list\" style=\"margin-top:8px;\"> 
          <li><span class=\"item-title\">Compliance readiness</span><span class=\"item-sub\">Aligns with national quality frameworks and prepares for external audits.</span></li>
          <li><span class=\"item-title\">Patient safety</span><span class=\"item-sub\">Surfaces risk areas and strengthens safety‑critical practices across care delivery.</span></li>
          <li><span class=\"item-title\">Continuous improvement</span><span class=\"item-sub\">Provides a repeatable score and guidance to track progress over time.</span></li>
        </ul>
      </div>

      <div class=\"card\"> 
        <h3>Get started in 3 simple steps</h3>
        <div class=\"steps-grid\">
          <div class=\"step-card step-1\">
            <div class=\"step-title\"><span class=\"step-chip\">📋</span>1) Conduct Self Assessment</div>
            <div class=\"step-sub\">Pick the most relevant quality checklist for your facility.</div>
          </div>
          <div class=\"step-card step-2\">
            <div class=\"step-title\"><span class=\"step-chip\">✅</span>2) Answer the Metrics</div>
            <div class=\"step-sub\">Select the practices you comply with — it only takes minutes.</div>
          </div>
          <div class=\"step-card step-3\">
            <div class=\"step-title\"><span class=\"step-chip\">📊</span>3) View Your QSAS Score</div>
            <div class=\"step-sub\">Download your report; optionally submit for Admin verification and certificate.</div>
          </div>
        </div>
        <p class=\"hint mt\"><strong>How the score is computed:</strong> QSAS uses up to 10 metrics per checklist. Each “Yes” contributes an equal share so the total score is out of 100 points.</p>
      </div>

      <div class=\"card\"> 
        <h3>QSAS Scoring Classifications — Healthcare Organizations in India</h3>
        <ul class=\"legend-list\"> 
          <li> 
            <div class=\"item-title\"><span class=\"badge badge-exemplary\">Exemplary</span> ≥ 90%</div>
            <div class=\"hint\">Well-established quality practices; maintain standardization and continuous improvement.</div>
          </li>
          <li> 
            <div class=\"item-title\"><span class=\"badge badge-strong\">Strong</span> ≥ 75%</div>
            <div class=\"hint\">Solid systems; target improvements through audits and PDSA cycles.</div>
          </li>
          <li> 
            <div class=\"item-title\"><span class=\"badge badge-developing\">Developing</span> ≥ 50%</div>
            <div class=\"hint\">Growing capabilities; formalize procedures, owners, and indicators.</div>
          </li>
          <li> 
            <div class=\"item-title\"><span class=\"badge badge-early\">Early</span> ≥ 25%</div>
            <div class=\"hint\">Foundational stage; establish governance, documentation, and regular audits.</div>
          </li>
          <li> 
            <div class=\"item-title\"><span class=\"badge badge-needs-improvement\">Needs Immediate Improvement</span> &lt; 25%</div>
            <div class=\"hint\">Critical gaps; address safety risks and define a 90-day remediation plan.</div>
          </li>
        </ul>
      </div>
    </div>

    <div class=\"site-footer\">© QuXAT — Quality Improvement Support</div>
  </body>
</html>
"""
    return html

if section == "Home":
    _set_query_section("QuXAT Score Home")
    st.session_state["section"] = "QuXAT Score Home"
    _safe_embed("quxat-score.html", height=1200, scrolling=True)
elif section == "User Assessment":
    # Render the embedded User page at the very top (no extra Streamlit headers)
    # Pass through deep-link parameters (category/checklist) to the embedded page via localStorage
    qp = _get_query_params()
    raw_cat = qp.get("category")
    raw_chk = qp.get("checklist")
    cat = None
    chk = None
    if isinstance(raw_cat, list):
        cat = raw_cat[0] if raw_cat else None
    elif isinstance(raw_cat, str):
        cat = raw_cat
    if isinstance(raw_chk, list):
        chk = raw_chk[0] if raw_chk else None
    elif isinstance(raw_chk, str):
        chk = raw_chk
    js_bootstrap = """
    (function(){{
      try {{
        var cat = {cat};
        var chk = {chk};
        if (cat) localStorage.setItem('qsas_boot_category', String(cat));
        if (chk) localStorage.setItem('qsas_boot_checklist', String(chk));
      }} catch(e) {{}}
    }})();
    """.format(cat=repr(cat), chk=repr(chk))
    _safe_embed("user.html", height=2200, scrolling=True, bootstrap_js=js_bootstrap)
elif section == "QuXAT Advisory Services":
    _safe_embed("advisory.html", height=1200, scrolling=True)
elif section == "QuXAT Reports":
    _safe_embed("reports.html", height=1400, scrolling=True)
elif section == "QuXAT Score Home":
    render_quxat_home()
elif section == "Self Assessment":
    render_self_assessment()
elif section == "Admin":
    render_admin()
else:
    # Default fallback: QuXAT Score Home
    _set_query_section("QuXAT Score Home")
    st.session_state["section"] = "QuXAT Score Home"
    _safe_embed("quxat-score.html", height=1200, scrolling=True)
    # Helper to persist admin records
    def _append_admin_record(action: str):
        try:
            root = Path("data")
            root.mkdir(exist_ok=True)
            fp = root / "admin_records.json"
            if fp.exists():
                with fp.open("r", encoding="utf-8") as f:
                    recs = json.load(f)
            else:
                recs = []
            recs.append({
                "score_id": score_id,
                "org": org or "",
                "email": email or "",
                "score": score,
                "label": label,
                "selected": selected,
                "total": len(items),
                "action": action,
                "ts": now.isoformat(timespec='seconds')
            })
            with fp.open("w", encoding="utf-8") as f:
                json.dump(recs, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
