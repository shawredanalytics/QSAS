## QSAS Platform — Version 2 (2025-11-13)

### Highlights
- New Advisory Services page with plans for NABH Full, NABH Entry, NABL Accreditation, NABL Entry, and JCI.
- Gap Assessment flow: plan-specific self-check with preparedness score, classification, and suggestions.
- Healthcare Quality Grid Registration: logo-only header, hero banner, accreditation checkboxes, location fields, live summary and suggestions, type-specific guideline sets, no internal iframe scroll.
- Home page: Quick Actions, At a Glance KPIs, mobile-friendly layout; larger centered logo; table/card improvements.
- Admin: Delete registrations; view dialogs show metric names without points.
- New checklist: Highway Development Organizations — Quality & Safety Improvement (Public & Community).

### Controls & Platform Behavior
- Shareable deep links via query params; section routing preserved.
- Sidebar toggle visible; hides Streamlit app menu and feedback; hides toolbar Fork/Deploy/Rerun.
- Pages with embedded content use full-page scrolling where applicable.
- Mobile/tablet responsive CSS for hero, lists, certificate rows, and tables.
- Data stored client-side (localStorage) for checklists, metrics, assessments, and grid registrations.

### Security & UX
- No secrets stored; avoids leaking Cloud badges; consistent corporate look.
- Clear headers showing selected checklist and descriptions when starting assessments from Home.

### Deployment
- Streamlit Community Cloud: repo `shawredanalytics/QSAS`, branch `main`, entry `app.py`, custom subdomain `quxatsas`.
