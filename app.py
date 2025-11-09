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

st.set_page_config(page_title="QuXAT Healthcare Organization Self Assessment", layout="wide")

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
        st.session_state["section"] = val

def _set_query_section(value: str):
    try:
        st.experimental_set_query_params(section=value)
    except Exception:
        pass

# Sidebar: render once per run to avoid duplication
def render_sidebar_once():
    # Sidebar disabled — all navigation is handled from the Home page.
    if st.session_state.get("_sidebar_rendered"):
        return
    if "section" not in st.session_state:
        st.session_state["section"] = "Home"
    st.session_state["_sidebar_rendered"] = True

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
    st.components.v1.html(html_index, height=2200, scrolling=True)
elif section == "User Assessment":
    # Render the embedded User page at the very top (no extra Streamlit headers)
    html_user = build_embedded_page("user.html")
    st.components.v1.html(html_user, height=2200, scrolling=True)
else:  # Admin
    # Page header for other sections appears at the top
    st.title("QuXAT Self Assessment (QSA)")
    st.caption("Assess your organization's quality journey and generate score & certificates")
    st.subheader("Admin")
    if mode == "Local iframe":
        st.components.v1.html(
            '<iframe src="http://localhost:8000/admin.html" style="width:100%; height:100vh; border:none;"></iframe>',
            height=1800,
            scrolling=False,
        )
    else:
        # Inject admin credentials and optional auto-login into embedded Admin page
        js_bootstrap = f"""
        (function(){{
          try {{
            const K={{u:'qsas_admin_username',p:'qsas_admin_password'}};
            const u={admin_username!r};
            const p={admin_password!r};
            if (u) localStorage.setItem(K.u, u);
            if (p) localStorage.setItem(K.p, p);
          }} catch(e) {{}}
          if ({str(bool(admin_auto_login)).lower()}) {{
            window.addEventListener('load', function(){{
              try {{
                const form = document.getElementById('loginForm');
                const uEl = document.getElementById('adminUsername');
                const pEl = document.getElementById('adminPassword');
                if (uEl) uEl.value = {admin_username!r};
                if (pEl) pEl.value = {admin_password!r};
                if (form) form.dispatchEvent(new Event('submit', {{ bubbles: true, cancelable: true }}));
              }} catch(e) {{}}
            }});
          }}
        }})();
        """
        html_admin = build_embedded_page("admin.html", bootstrap_js=js_bootstrap)
        st.components.v1.html(html_admin, height=2200, scrolling=True)