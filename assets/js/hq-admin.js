// HQ Grid Admin portal: review and verify grid registrations
(function(){
  const loginForm = document.getElementById('loginForm');
  const adminPanel = document.getElementById('gridAdminPanel');
  const statusFilter = document.getElementById('statusFilter');
  const refreshBtn = document.getElementById('refreshRegs');
  const mount = document.getElementById('gridRegsMount');
  const empty = document.getElementById('gridRegsEmpty');

  // Helpers: read admin creds from storage.js defaults
  function getStoredCreds(){
    try {
      return {
        username: localStorage.getItem('qsas_admin_username') || 'admin',
        password: localStorage.getItem('qsas_admin_password') || 'quxat123',
      };
    } catch(e) {
      return { username: 'admin', password: 'quxat123' };
    }
  }

  function renderRegs(){
    if (!mount) return;
    let regs = [];
    try { regs = (typeof getGridRegistrations === 'function') ? getGridRegistrations() : []; } catch(e) { regs = []; }
    const filter = (statusFilter && statusFilter.value) || 'all';
    if (filter !== 'all') regs = regs.filter(r => String(r.status||'pending') === filter);
    mount.innerHTML = '';
    if (!regs.length) { empty.hidden = false; return; } else { empty.hidden = true; }
    regs.sort((a,b) => new Date(b.submittedAt||0) - new Date(a.submittedAt||0));
    regs.forEach(r => {
      const item = document.createElement('div');
      item.className = 'item';
      const left = document.createElement('div');
      left.className = 'left';
      const right = document.createElement('div');
      right.className = 'right';

      const cls = String(r.classification || '-');
      const percent = Number(r.scorePercent ?? 0);
      const badge = percent >= 90 ? 'badge-exemplary' : percent >= 75 ? 'badge-strong' : percent >= 50 ? 'badge-developing' : percent >= 25 ? 'badge-early' : 'badge-needs-improvement';

      left.innerHTML = `<div class="item-title">${r.orgName || 'Organization'} • ${r.orgType || 'Healthcare'}</div>
        <div class="item-sub">Score ${r.score} • Classification <span class="badge ${badge}">${cls}</span> (${percent}%) • ${String(r.status||'pending').toUpperCase()} • submitted ${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</div>`;

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn';
      viewBtn.textContent = 'View Details';
      viewBtn.onclick = () => {
        const lines = (Array.isArray(r.selectedMetrics) ? r.selectedMetrics : []).map(m => `- ${m.name} (+${m.points})`).join('\n');
        const sug = Array.isArray(r.suggestions) && r.suggestions.length ? `\nSuggested Improvements:\n${r.suggestions.map(x => `- ${x}`).join('\n')}\n` : '';
        const extra = [
          r.email ? `Email: ${r.email}` : null,
          r.repName ? `Representative: ${r.repName}` : null,
          r.repDesignation ? `Designation: ${r.repDesignation}` : null,
          r.achievements ? `Achievements: ${r.achievements}` : null,
        ].filter(Boolean).join('\n');
        alert(`${r.orgName || 'Organization'} • ${r.orgType || 'Healthcare'}\n${extra ? extra + '\n' : ''}${sug}\nSelected Guidelines:\n${lines}`);
      };

      const approveBtn = document.createElement('button');
      approveBtn.className = 'btn btn-primary';
      approveBtn.textContent = 'Approve';
      approveBtn.onclick = () => {
        try { updateGridRegistrationStatusById(r.id, 'approved'); } catch(e) {}
        renderRegs();
        alert('Registration approved and will appear on Home page.');
      };

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn';
      rejectBtn.textContent = 'Reject';
      rejectBtn.onclick = () => {
        try { updateGridRegistrationStatusById(r.id, 'rejected'); } catch(e) {}
        renderRegs();
        alert('Registration rejected.');
      };

      right.append(viewBtn, approveBtn, rejectBtn);
      item.append(left, right);
      mount.appendChild(item);
    });
  }

  // Login
  loginForm && loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userEl = document.getElementById('adminUsername');
    const passEl = document.getElementById('adminPassword');
    const { username, password } = getStoredCreds();
    const u = (userEl && userEl.value) || '';
    const p = (passEl && passEl.value) || '';
    if (u === username && p === password) {
      adminPanel.hidden = false;
      // Persist for convenience
      try { localStorage.setItem('qsas_admin_username', u); } catch {}
      try { localStorage.setItem('qsas_admin_password', p); } catch {}
      renderRegs();
    } else {
      alert('Invalid credentials');
    }
  });

  // Filters and refresh
  statusFilter && statusFilter.addEventListener('change', renderRegs);
  refreshBtn && refreshBtn.addEventListener('click', renderRegs);

  // If already have creds, auto-show panel
  (function boot(){
    const { username, password } = getStoredCreds();
    const u = (document.getElementById('adminUsername') || {}).value || '';
    const p = (document.getElementById('adminPassword') || {}).value || '';
    if (u === username && p === password) {
      adminPanel.hidden = false;
      renderRegs();
    }
  })();
})();