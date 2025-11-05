// Simple branding initializer for QSAS aligning with quxat.com elements
(() => {
  const logoEl = document.getElementById('brandLogo');
  const certLogoEl = document.getElementById('certificateLogo');
  const cookieBanner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('acceptCookiesBtn');

  // Use provided local PNG logo
  const defaultLogo = 'assets/QuXAT%20Logo%20Facebook.png';
  if (logoEl) {
    logoEl.src = defaultLogo;
    logoEl.onerror = () => { logoEl.remove(); }; // fallback to title text if logo not reachable
  }
  if (certLogoEl) {
    certLogoEl.src = defaultLogo;
    certLogoEl.onerror = () => { certLogoEl.remove(); };
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
})();