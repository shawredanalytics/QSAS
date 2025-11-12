## Objective
Backup the existing project to a Git repository and deploy the Streamlit app publicly at a custom subdomain `https://quxatsas.streamlit.app/`.

## Git Backup
1. Initialize repository
- In the project root: `git init`
- Set main branch: `git branch -M main`
2. Stage and commit
- `git add .`
- `git commit -m "Initial commit: QuXAT Self Assessment (QSAS)"`
3. Create remote repository
- Create an empty public repo on your Git provider (e.g., GitHub) named `quxatsas` (or `quxat-self-assessment`).
- Add remote (choose one):
  - HTTPS: `git remote add origin https://github.com/<your-username>/<repo>.git`
  - SSH: `git remote add origin git@github.com:<your-username>/<repo>.git`
4. Push
- `git push -u origin main`

## Pre-Deployment Check
1. Entry file
- Ensure the main file is `app.py` at the repository root (confirmed).
2. Python dependencies
- `requirements.txt` contains `streamlit>=1.34` (confirmed). No other server dependencies.
3. Static assets
- All assets are relative to repo: `assets/**` (confirmed). Embedded HTML uses data URLs and CDN for `jsPDF`.
4. Local smoke test (optional)
- Run locally: `streamlit run app.py` and verify page sections render and PDF generation works.

## Streamlit Cloud Deployment
1. Sign in
- Visit `https://share.streamlit.io` (Streamlit Community Cloud) and sign in with GitHub.
2. New app
- Click “New app”, select the repo, branch `main`, and set the main file to `app.py`.
3. Build
- Streamlit Cloud installs from `requirements.txt` and launches the app.
4. Subdomain configuration
- In the app settings → Advanced, set the custom subdomain to `quxatsas` to target `https://quxatsas.streamlit.app/`.
- If `quxatsas` is already taken, choose the closest available (e.g., `quxatsas-demo`) and we will update the target URL accordingly.

## Verification Checklist
- Open the deployed URL and confirm:
- Home embeds: navigation links open the correct sections (`Home`, `User Assessment`, `Admin`, `Healthcare Quality Grid`, `Register for the Healthcare Quality Grid`).
- User Assessment: start form, metric selection, score computation, suggestions, unverified report and certificate PDF download.
- Admin: login via localStorage creds, checklist/metric management, approve/reject assessments, verified certificate generation.
- Grid pages: registrations flow and approved organizations display on Home.
- CDN: `jsPDF` loads; PDFs generate successfully.
- Styling and images load (logo, seal, signature) via data URLs.

## Notes & Considerations
- Data persistence is client-side (`localStorage`). Admin approvals and submissions are per-browser; no server database is involved.
- No secrets or environment variables required.
- The custom subdomain depends on availability on Streamlit Cloud.

## Deliverables
- Public Git repository URL
- Live app URL on Streamlit Cloud (targeting `https://quxatsas.streamlit.app/`)
- Short verification report confirming core flows are working