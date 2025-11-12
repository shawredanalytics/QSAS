## Current Status
No changes performed yet. You asked for a plan-first approach, so the repository hasn’t been pushed and the app isn’t live until you confirm.

## Backup to GitHub (shawredanalytics/QSAS)
1. Initialize Git
- `git init`
- `git branch -M main`
2. Commit project
- `git add .`
- `git commit -m "Initial commit: QuXAT Self Assessment (QSAS)"`
3. Add remote and push
- `git remote add origin https://github.com/shawredanalytics/QSAS.git`
- If remote exists, ensure it matches; otherwise update with `git remote set-url origin ...`
- `git push -u origin main`
- If the remote is non-empty, `git pull --rebase origin main` then `git push -u origin main`

## Deploy to Streamlit Community Cloud
1. Sign in with GitHub at `https://share.streamlit.io`
2. Create new app
- Repo: `shawredanalytics/QSAS`
- Branch: `main`
- Main file: `app.py`
3. Configure subdomain
- Set custom subdomain to `quxatsas` → target `https://quxatsas.streamlit.app/`
- If taken, choose a close alternative and share the final URL.
4. Launch
- Streamlit Cloud will install `requirements.txt` and run the app.

## Verification Checklist
- Open the live URL and verify:
- Home renders and links open sections
- User Assessment: form → metrics → score → suggestions → PDF/Certificate
- Admin: login via localStorage creds → manage checklists/metrics → approve/reject → verified certificate
- Grid pages: registration and approved listings on Home
- `jsPDF` CDN loads; images (logo/seal/signature) render via data URLs

## Deliverables
- GitHub repo populated at `https://github.com/shawredanalytics/QSAS`
- Live URL on Streamlit Cloud (prefer `https://quxatsas.streamlit.app/`) with quick verification notes

Approve to proceed and I will execute these steps immediately and report back with links and verification.