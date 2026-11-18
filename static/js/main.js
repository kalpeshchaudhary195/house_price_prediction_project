/**
 * Main application client utilities.
 * Handles theme switcher (light/dark mode), toast notifications,
 * collapsible sidebar, location selector, and Indian currency formatting.
 */

// Theme Management
(function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', target);
  localStorage.setItem('theme', target);

  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = target === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars-fill text-secondary';
  }
}

// Sidebar Management
(function initSidebar() {
  document.addEventListener('DOMContentLoaded', () => {
    const layout = document.getElementById('appLayout');
    const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (layout && isCollapsed && window.innerWidth >= 992) {
      layout.classList.add('sidebar-collapsed');
    }

    // Set correct icon on load
    const icon = document.getElementById('theme-toggle-icon');
    const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    if (icon) {
      icon.className = currentTheme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars-fill text-secondary';
    }
  });
})();

function toggleSidebar() {
  const layout = document.getElementById('appLayout');
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (window.innerWidth < 992) {
    // Mobile mode
    if (sidebar) {
      const isShowing = sidebar.classList.toggle('show');
      if (backdrop) backdrop.classList.toggle('show', isShowing);
    }
  } else {
    // Desktop mode
    if (layout) {
      const isCollapsed = layout.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
    }
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('show');
  if (backdrop) backdrop.classList.remove('show');
}

// Indian Rupee Formatter helper
function formatINR(val) {
  val = parseFloat(val);
  if (isNaN(val)) return '₹ 0';
  if (val >= 10000000) {
    return `₹ ${(val / 10000000).toFixed(2)} Cr`;
  } else if (val >= 100000) {
    return `₹ ${(val / 100000).toFixed(2)} Lakh`;
  } else {
    return `₹ ${val.toLocaleString('en-IN')}`;
  }
}

function formatINRExact(val) {
  val = Math.round(parseFloat(val));
  if (isNaN(val)) return '₹ 0';
  return `₹ ${val.toLocaleString('en-IN')}`;
}

// Global Quick Search Filter
function handleGlobalSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      window.location.href = `/properties?city=${encodeURIComponent(query)}`;
    }
  }
}

// Simple Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(message);
    return;
  }
  const bgClass = type === 'success' ? 'bg-success text-white' : type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white';
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0 show mb-2 shadow`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body font-medium">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(toastEl);
  setTimeout(() => {
    toastEl.classList.remove('show');
    toastEl.remove();
  }, 4000);
}
