// ============================================================
// Coffee School Event — Shared App Utilities
// ============================================================

// ── ID Generator ─────────────────────────────────────────────
function generateId() {
  return 'REG-' + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: '☕' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span aria-hidden="true">${icons[type] || '•'}</span> ${message}`;
  toast.setAttribute('role', 'status');
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ── API Client ────────────────────────────────────────────────
const API = {
  // Register new attendee (public)
  async register(data) {
    const res = await fetch(CONFIG.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for CORS
      body:    JSON.stringify({ action: 'register', ...data }),
    });
    return res.json();
  },

  // Fetch all registrations (admin)
  async getAll(pass) {
    const url = `${CONFIG.API_URL}?action=getAll&pass=${encodeURIComponent(pass)}`;
    const res = await fetch(url);
    return res.json();
  },

  // Update a registration (admin)
  async update(pass, data) {
    const res = await fetch(CONFIG.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify({ action: 'update', pass, ...data }),
    });
    return res.json();
  },

  // Delete a registration (admin)
  async delete(pass, id) {
    const res = await fetch(CONFIG.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify({ action: 'delete', pass, id }),
    });
    return res.json();
  },
};

// ── PDF Export ────────────────────────────────────────────────
function exportPDF() {
  const printHeader = document.querySelector('.print-header');
  const now = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  if (printHeader) {
    printHeader.querySelector('.print-date').textContent = `تاريخ التصدير: ${now}`;
  }
  window.print();
}
