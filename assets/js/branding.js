// Simple branding initializer for QSAS aligning with quxat.com elements
(() => {
  const logoEl = document.getElementById('brandLogo');
  const bottomLogoEl = document.getElementById('brandLogoBottom');
  const certLogoEl = document.getElementById('certificateLogo');
  const cookieBanner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('acceptCookiesBtn');

  // Use Facebook PNG across pages; if relative path fails, try absolute path
  const pngLogo = 'assets/QuXAT%20Logo%20Facebook.png';
  const pngLogoAbs = '/assets/QuXAT%20Logo%20Facebook.png';
  if (logoEl) {
    logoEl.src = pngLogo;
    logoEl.onerror = () => {
      logoEl.onerror = null;
      logoEl.src = pngLogoAbs;
    };
  }
  // Ensure bottom brand bar logo on User page loads even in embedded contexts
  if (bottomLogoEl) {
    bottomLogoEl.src = pngLogo;
    bottomLogoEl.onerror = () => {
      bottomLogoEl.onerror = null;
      bottomLogoEl.src = pngLogoAbs;
    };
  }
  if (certLogoEl) {
    certLogoEl.src = pngLogo;
    certLogoEl.onerror = () => {
      certLogoEl.onerror = null;
      certLogoEl.src = pngLogoAbs;
    };
  }

  // Cookie consent banner (demo only)
  const KEY = 'qsas_cookie_accepted';
  const accepted = localStorage.getItem(KEY) === 'true';
  if (cookieBanner && !accepted) {
    cookieBanner.hidden = false;
  }
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(KEY, 'true');
      if (cookieBanner) cookieBanner.hidden = true;
    });
  }

  // Back-to-top button
  try {
    let btn = document.getElementById('backToTopBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'backToTopBtn';
      btn.className = 'back-to-top';
      btn.type = 'button';
      btn.textContent = 'Top';
      document.body.appendChild(btn);
    }
    const toggle = () => {
      const scrolled = (document.documentElement.scrollTop || document.body.scrollTop) > 400;
      btn.style.display = scrolled ? 'inline-flex' : 'none';
    };
    window.addEventListener('scroll', toggle);
    window.addEventListener('load', toggle);
    btn.addEventListener('click', () => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0, 0); }
    });
  } catch {}

  // Global version banner (appears on all pages)
  try {
    if (String(window.QSAS_PAGE || '').toLowerCase() === 'organizational') {
      // Skip global version banner on Organizational Self Assessment page
      return;
    }
    const verText = `QSAS Portal — ver ${String(window.QSAS_VERSION || '3')}`;
    let wrap = document.getElementById('qsasVersionBanner');
    if (!wrap) {
      const container = document.querySelector('main.container') || document.body;
      wrap = document.createElement('section');
      wrap.id = 'qsasVersionBanner';
      wrap.className = 'card accent-slate';
      const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '12px'; row.id = 'qsasVersionRow';
      const img = document.createElement('img'); img.alt = 'QuXAT'; img.style.height = '28px'; img.style.borderRadius = '6px';
      img.src = 'assets/QuXAT%20Logo%20Facebook.png'; img.onerror = () => { img.onerror = null; img.src = '/assets/QuXAT%20Logo%20Facebook.png'; };
      const title = document.createElement('div'); title.id = 'qsasVersionTitle'; title.style.fontWeight = '700'; title.textContent = verText;
      const sub = document.createElement('div'); sub.id = 'qsasVersionSub'; sub.className = 'hint';
      const d = new Date(); const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
      sub.textContent = `Quality & Safety Self Assessment • ${dateStr}`;
      row.append(img, title);
      wrap.append(row, sub);
      if (container.firstChild) { container.insertBefore(wrap, container.firstChild.nextSibling); } else { container.appendChild(wrap); }
    } else {
      const title = document.getElementById('qsasVersionTitle');
      if (title) title.textContent = verText;
    }
  } catch {}
})();
