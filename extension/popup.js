document.addEventListener('DOMContentLoaded', function () {
  // 1. Check current page on startup
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0]) {
        const url = tabs[0].url;
        try {
          const parsed = new URL(url);
          const domain = parsed.hostname;
          
          if (domain === 'localhost' || domain === '127.0.0.1') {
            document.getElementById('siteUrl').textContent = 'Local Host (Scam Hunter)';
            updateBadge('siteRisk', 'Safe', 'Internal Node');
          } else {
            document.getElementById('siteUrl').textContent = domain;
            checkSafety(domain, 'siteRisk', false);
          }
        } catch {
          document.getElementById('siteUrl').textContent = 'System / Utility Page';
          updateBadge('siteRisk', 'Safe', 'Protected');
        }
      }
    });
  } else {
    document.getElementById('siteUrl').textContent = 'Local Test Context';
    updateBadge('siteRisk', 'Safe', 'Unmonitored');
  }

  // 2. Setup manual search form
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const val = document.getElementById('searchInput').value.trim();
    if (!val) return;
    
    const btn = document.getElementById('searchBtn');
    btn.disabled = true;
    btn.textContent = '...';
    
    checkSafety(val, null, true);
  });
});

function updateBadge(elementId, riskLevel, label) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `risk-badge ${riskLevel}`;
  el.textContent = label || riskLevel;
}

const BACKEND_URL = 'http://localhost:8000'; // Update this with your Render URL (e.g. https://scam-hunter-api.onrender.com)

async function checkSafety(value, badgeId, isManualSearch) {
  const apiEndpoint = `${BACKEND_URL}/api/registry/check?value=${encodeURIComponent(value)}`;
  const detailsPanel = document.getElementById('detailsPanel');
  const btn = document.getElementById('searchBtn');
  
  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) throw new Error('API server returned error status');
    
    const data = await response.json();
    
    if (isManualSearch) {
      // Update manual details card
      detailsPanel.style.display = 'block';
      document.getElementById('detailStatus').textContent = data.exists ? 'VERIFIED FRAUD' : 'NO REPORT LOGGED';
      document.getElementById('detailStatus').style.color = data.exists ? '#ef4444' : '#22c55e';
      document.getElementById('detailRisk').textContent = `${data.risk_level} (${Math.round(data.risk_score)}/100)`;
      document.getElementById('detailCategory').textContent = data.scam_type;
      document.getElementById('detailReports').textContent = `${data.total_reports} incident logs`;
      
      btn.disabled = false;
      btn.textContent = 'Verify';
    } else if (badgeId) {
      updateBadge(badgeId, data.risk_level, data.risk_level);
    }
  } catch (err) {
    console.error('Scam Hunter extension check failed:', err);
    if (isManualSearch) {
      detailsPanel.style.display = 'block';
      document.getElementById('detailStatus').textContent = 'CONNECTION ERROR';
      document.getElementById('detailStatus').style.color = '#ef4444';
      document.getElementById('detailRisk').textContent = 'Backend Offline';
      document.getElementById('detailCategory').textContent = '-';
      document.getElementById('detailReports').textContent = 'Check API server health';
      
      btn.disabled = false;
      btn.textContent = 'Verify';
    } else if (badgeId) {
      updateBadge(badgeId, 'Safe', 'No Feed Connect');
    }
  }
}
