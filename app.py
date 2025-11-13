import streamlit as st
import base64
from pathlib import Path

ROOT = Path(__file__).parent

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
    <script>{storage_js}</script>
    <script>{branding_js}</script>
  </head>
  <body>
    {body}
    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>
    <script>{page_js}</script>
    {f"<script>{bootstrap_js}</script>" if bootstrap_js else ""}
  </body>
</html>
"""
    return composed

st.set_page_config(page_title="QuXAT Healthcare Organization Self Assessment", layout="wide", initial_sidebar_state="expanded")

# Hide Streamlit's default 3-dots app menu on the top-right
st.markdown(
    """
    <style>
    button[title="View app menu"] { display: none !important; visibility: hidden !important; }
    #MainMenu { display: none !important; visibility: hidden !important; }
    button[aria-label*="feedback"], button[title*="feedback"] { display: none !important; visibility: hidden !important; }
    a[href*="streamlit.app"], a[href*="streamlit.io"] { display: none !important; visibility: hidden !important; }
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
        st.query_params["section"] = value
    except Exception:
        try:
            st.experimental_set_query_params(section=value)
        except Exception:
            pass

# Sidebar: render navigation buttons for Home and Admin
def render_sidebar_once():
    # Initialize section
    if "section" not in st.session_state:
        st.session_state["section"] = "Home"

    with st.sidebar:
        st.subheader("Navigation")
        # Primary navigation at the top
        go_home = st.button("QSAS Portal", use_container_width=True)
        go_hq_grid = st.button("Healthcare Quality Grid", use_container_width=True)
        go_hq_register = st.button("Register for Healthcare Quality Grid", use_container_width=True)
        go_advisory = st.button("QuXAT Advisory Services", use_container_width=True)

        # Visual separation, admin actions moved to the bottom area
        try:
            st.divider()
        except Exception:
            st.markdown("<hr>", unsafe_allow_html=True)

        st.subheader("Admin")
        go_admin = st.button("QSAS Admin Portal", use_container_width=True)

    if go_home:
        st.session_state["section"] = "Home"
        _set_query_section("Home")
        st.rerun()
    if go_admin:
        st.session_state["section"] = "Admin"
        _set_query_section("Admin")
        st.rerun()
    if go_hq_register:
        st.session_state["section"] = "Register for the Healthcare Quality Grid"
        _set_query_section("Register for the Healthcare Quality Grid")
        st.rerun()
    if go_hq_grid:
        st.session_state["section"] = "Healthcare Quality Grid"
        _set_query_section("Healthcare Quality Grid")
        st.rerun()
    if go_advisory:
        st.session_state["section"] = "QuXAT Advisory Services"
        _set_query_section("QuXAT Advisory Services")
        st.rerun()

_sync_section_from_query()
render_sidebar_once()
section = st.session_state.get("section", "Home")
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
    # Embed the updated Home page from index.html so UI changes are visible.
    html_index = build_embedded_page("index.html")
    st.components.v1.html(html_index, height=4200, scrolling=False)
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
    html_user = build_embedded_page("user.html", bootstrap_js=js_bootstrap)
    st.components.v1.html(html_user, height=2200, scrolling=True)
elif section == "Healthcare Quality Grid":
    # Embed the new Healthcare Quality Grid page
    html_grid = build_embedded_page("hq-grid.html")
    st.components.v1.html(html_grid, height=2200, scrolling=True)
elif section == "Register for the Healthcare Quality Grid":
    # Embed the dedicated registration page (no internal iframe scroll)
    html_reg = build_embedded_page("hq-register.html")
    st.components.v1.html(html_reg, height=4200, scrolling=False)
elif section == "QuXAT Advisory Services":
    html_adv = build_embedded_page("advisory.html")
    st.components.v1.html(html_adv, height=3800, scrolling=False)
elif section == "Gap Assessment":
    qp = _get_query_params()
    raw_plan = qp.get("plan")
    plan = None
    if isinstance(raw_plan, list):
        plan = raw_plan[0] if raw_plan else None
    elif isinstance(raw_plan, str):
        plan = raw_plan
    js_bootstrap = """
    (function(){
      try {
        var plan = %s;
        if (plan) localStorage.setItem('qsas_gap_plan', String(plan));
      } catch(e) {}
    })();
    """ % (repr(plan))
    html_gap = build_embedded_page("gap-assessment.html", bootstrap_js=js_bootstrap)
    st.components.v1.html(html_gap, height=3800, scrolling=False)
else:  # Admin
    # Render the embedded Admin page at the very top (no extra Streamlit headers)
    if mode == "Local iframe":
        st.components.v1.html(
            '<iframe src="http://localhost:8000/admin.html" style="width:100%; height:100vh; border:none;"></iframe>',
            height=1800,
            scrolling=False,
        )
    else:
        # Inject admin credentials and optional auto-login into embedded Admin page
        js_bootstrap = """
        (function(){{
          try {{
            const K={{u:'qsas_portal_username',p:'qsas_portal_password'}};
            const u={u};
            const p={p};
            if (u) localStorage.setItem(K.u, u);
            if (p) localStorage.setItem(K.p, p);
          }} catch(e) {{}}
          if ({auto_login}) {{
            window.addEventListener('load', function(){{
              try {{
                const form = document.getElementById('loginForm');
                const uEl = document.getElementById('adminUsername');
                const pEl = document.getElementById('adminPassword');
                if (uEl) uEl.value = {u};
                if (pEl) pEl.value = {p};
                if (form) form.dispatchEvent(new Event('submit', {{ bubbles: true, cancelable: true }}));
              }} catch(e) {{}}
            }});
          }}
        }})();
        """.format(u=repr(admin_username), p=repr(admin_password), auto_login=str(bool(admin_auto_login)).lower())
        html_admin = build_embedded_page("admin.html", bootstrap_js=js_bootstrap)
        st.components.v1.html(html_admin, height=2200, scrolling=True)
