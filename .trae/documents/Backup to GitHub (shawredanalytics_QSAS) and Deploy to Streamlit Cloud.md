## Objective

Back up the current project to the GitHub repository `https://github.com/shawredanalytics/QSAS` and deploy it publicly on Streamlit Community Cloud at `https://quxatsas.streamlit.app/`.

## Prerequisites

* Git installed and authenticated with GitHub (via HTTPS or SSH).

* Access to the GitHub repo `shawredanalytics/QSAS` (created and empty or ready to receive code).

## Backup to GitHub

1. Initialize and configure Git (PowerShell in project root)

* `git init`

* `git branch -M main`

* Optional (if not set): `git config user.name "<Your Name>"` and `git config user.email "<you@example.com>"`

1. Stage and commit

* `git add .`

* `git commit -m "Initial commit: QuXAT Self Assessment (QSAS)"`

1. Add remote

* `git remote add origin https://github.com/shawredanalytics/QSAS.git`

* Verify: `git remote -v`

1. Push to GitHub

* `git push -u origin main`

* If the remote already has commits, pull and re-push without force:

  * `git pull --rebase origin main` then `git push -u origin main`

## Pre-Deployment Verification

* Entry file is `app.py` at repo root (confirmed).

* Dependencies in `requirements.txt` include `streamlit>=1.34` (confirmed).

* Static assets under `assets/**`; PDFs via `jsPDF` CDN; no env secrets.

* Optional local smoke test: `streamlit run app.py`.

## Deploy to Streamlit Community Cloud

1. Sign in

* Visit `https://share.streamlit.io` and sign in with GitHub.

1. Create new app

* Repo: `shawredanalytics/QSAS`

* Branch: `main`

* Main file: `app.py`

1. Configure subdomain

* In app settings → Advanced, set custom subdomain to `quxatsas` to target `https://quxatsas.streamlit.app/`.

* If unavailable, choose a close alternative (e.g., `quxatsas-app`) and update the final URL.

1. Deploy

* Streamlit Cloud installs packages from `requirements.txt` and launches the app.

## Post-Deploy Verification

* Open the live URL and verify:

* Home renders with navigation and industry listings.

* User Assessment: start form, metric selection, scoring, suggestions, unverified PDF and certificate downloads.

* Admin: login via localStorage creds, manage checklists/metrics, approve/reject assessments, download verified certificate.

* Healthcare Quality Grid: registrations flow and approved listings on Home.

* CDN `jsPDF` loads and PDFs generate.

## Maintenance

* Future updates: commit to `main` and push; Streamlit Cloud redeploys automatically.

* No server-side persistence: assessments/approvals rely on browser `localStorage`.

## Deliverables

* GitHub repo populated at `https://github.com/shawredanalytics/QSAS`

* Live app URL (targeting `https://quxatsas.streamlit.app/`) and quick verification notes

