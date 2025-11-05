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

def build_embedded_page(html_rel: str):
    html = read_text(html_rel)
    css = read_text("assets/css/style.css")
    storage_js = read_text("assets/js/storage.js")
    branding_js = read_text("assets/js/branding.js")
    if "user.html" in html_rel:
        page_js = read_text("assets/js/user.js")
    else:
        page_js = read_text("assets/js/admin.js")
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
  </head>
  <body>
    {body}
    {assets_js}
    <script>{storage_js}</script>
    <script>{branding_js}</script>
    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>
    <script>{page_js}</script>
  </body>
</html>
"""
    return composed

st.set_page_config(page_title="QuXAT Self Assessment (QSA)", layout="wide")
st.title("QuXAT Self Assessment (QSA)")
st.caption("Streamlit app embedding User and Admin pages")

mode = st.radio("Render mode", ["Inline assets (Cloud)", "Local iframe"], index=0, horizontal=True)
tabs = st.tabs(["User", "Admin"]) 

with tabs[0]:
    st.subheader("User Page")
    if mode == "Local iframe":
        st.components.v1.html(
            '<iframe src="http://localhost:8000/user.html" style="width:100%; height:1000px; border:none;"></iframe>',
            height=1000,
            scrolling=True,
        )
    else:
        html_user = build_embedded_page("user.html")
        st.components.v1.html(html_user, height=1000, scrolling=True)

with tabs[1]:
    st.subheader("Admin Page")
    if mode == "Local iframe":
        st.components.v1.html(
            '<iframe src="http://localhost:8000/admin.html" style="width:100%; height:1000px; border:none;"></iframe>',
            height=1000,
            scrolling=True,
        )
    else:
        html_admin = build_embedded_page("admin.html")
        st.components.v1.html(html_admin, height=1000, scrolling=True)