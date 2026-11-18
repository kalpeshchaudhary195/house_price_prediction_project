/**
 * Prediction History Table & Export Handler.
 * Supports live search, city filter, sorting, pagination,
 * CSV download, PDF report generation, and deletion.
 */

let currentPage = 1;
let currentSort = 'date_desc';

document.addEventListener('DOMContentLoaded', () => {
  loadHistory(1);
  setupHistoryFilters();
});

function setupHistoryFilters() {
  const searchInput = document.getElementById('search-input');
  const cityFilter = document.getElementById('city-filter');
  const typeFilter = document.getElementById('type-filter');
  const sortSelect = document.getElementById('sort-select');

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadHistory(1), 350);
    });
  }

  if (cityFilter) cityFilter.addEventListener('change', () => loadHistory(1));
  if (typeFilter) typeFilter.addEventListener('change', () => loadHistory(1));
  if (sortSelect) sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadHistory(1);
  });
}

async function loadHistory(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('history-tbody');
  const paginationContainer = document.getElementById('pagination-container');
  const totalCountEl = document.getElementById('total-records-count');

  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span> Loading predictions...</td></tr>';

  const search = document.getElementById('search-input')?.value || '';
  const city = document.getElementById('city-filter')?.value || '';
  const propType = document.getElementById('type-filter')?.value || '';

  const params = new URLSearchParams({
    page: page,
    per_page: 10,
    sort_by: currentSort,
    search: search,
    city: city,
    property_type: propType
  });

  try {
    const res = await fetch(`/api/predictions?${params.toString()}`);
    const json = await res.json();

    if (!json.success || json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i> No prediction records found matching the filter criteria.</td></tr>';
      if (paginationContainer) paginationContainer.innerHTML = '';
      if (totalCountEl) totalCountEl.textContent = '0';
      return;
    }

    if (totalCountEl) totalCountEl.textContent = json.pagination.total_records;

    tbody.innerHTML = '';
    json.data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-bold text-muted">#${item.id}</td>
        <td>
          <div class="fw-semibold text-primary">${item.locality}</div>
          <div class="small text-muted">${item.city}, ${item.state}</div>
        </td>
        <td>
          <span class="badge bg-secondary-subtle text-secondary border">${item.property_type}</span>
          <div class="small text-muted mt-1">${item.bedrooms} BHK | ${item.bathrooms} Bath</div>
        </td>
        <td>
          <div class="fw-semibold">${item.area_sqft.toLocaleString('en-IN')} sq.ft.</div>
          <div class="small text-muted">${item.furnishing_status}</div>
        </td>
        <td>
          <div class="fw-bold text-success fs-6">${item.predicted_price_formatted}</div>
          <div class="small text-muted">${item.predicted_price_exact}</div>
        </td>
        <td>
          <span class="badge badge-model">${item.model_name}</span>
        </td>
        <td class="small text-muted">
          ${item.formatted_date}
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <a href="/api/predictions/${item.id}/pdf" class="btn btn-outline-primary" title="Download Official PDF Report">
              <i class="bi bi-file-earmark-pdf"></i> PDF
            </a>
            <button class="btn btn-outline-danger" onclick="deleteRecord(${item.id})" title="Delete Record">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination(json.pagination);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error loading data: ${err.message}</td></tr>`;
  }
}

function renderPagination(pg) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  if (pg.total_pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<ul class="pagination pagination-sm mb-0">';
  html += `<li class="page-item ${pg.has_prev ? '' : 'disabled'}">
    <button class="page-link" onclick="loadHistory(${pg.page - 1})">Previous</button>
  </li>`;

  const start = Math.max(1, pg.page - 2);
  const end = Math.min(pg.total_pages, pg.page + 2);

  for (let i = start; i <= end; i++) {
    html += `<li class="page-item ${i === pg.page ? 'active' : ''}">
      <button class="page-link" onclick="loadHistory(${i})">${i}</button>
    </li>`;
  }

  html += `<li class="page-item ${pg.has_next ? '' : 'disabled'}">
    <button class="page-link" onclick="loadHistory(${pg.page + 1})">Next</button>
  </li>`;
  html += '</ul>';

  container.innerHTML = html;
}

async function deleteRecord(id) {
  if (!confirm(`Are you sure you want to delete prediction record #${id}?`)) return;

  try {
    const res = await fetch(`/api/predictions/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(`Record #${id} deleted`, 'info');
      loadHistory(currentPage);
    } else {
      showToast('Delete failed: ' + json.message, 'danger');
    }
  } catch (e) {
    showToast('Delete request error: ' + e.message, 'danger');
  }
}

