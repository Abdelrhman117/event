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

// ── API Client (Google Apps Script CORS-safe) ─────────────────
async function postToAppsScript(payload) {
  // Google Apps Script returns a 302 redirect on POST.
  // Using a form-encoded approach avoids CORS preflight issues.
  const res = await fetch(CONFIG.API_URL, {
    method:  'POST',
    redirect: 'follow',
    body:    JSON.stringify(payload),
  });
  // Apps Script may redirect to a plain-text/JSON URL
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // If redirect returned HTML or non-JSON, treat as failure
    throw new Error('استجابة غير صالحة من السيرفر. تأكد من نشر الـ Apps Script بشكل صحيح.');
  }
}

const API = {
  // Register new attendee (public)
  async register(data) {
    return postToAppsScript({ action: 'register', ...data });
  },

  // Fetch all registrations (admin)
  async getAll(pass) {
    const url = `${CONFIG.API_URL}?action=getAll&pass=${encodeURIComponent(pass)}`;
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('فشل قراءة البيانات.');
    }
  },

  // Update a registration (admin)
  async update(pass, data) {
    return postToAppsScript({ action: 'update', pass, ...data });
  },

  // Delete a registration (admin)
  async delete(pass, id) {
    return postToAppsScript({ action: 'delete', pass, id });
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
