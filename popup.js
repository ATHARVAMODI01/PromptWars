/* ==========================================================================
   YouTube Cleaner - Extension Popup Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const keys = [
    'redirectShorts', 
    'hideSidebar', 
    'hideHome', 
    'hideSearch', 
    'hideGrid', 
    'blockVideoAds', 
    'blockDisplayAds'
  ];
  
  const shortsCounterEl = document.getElementById('stats-counter');
  const adsCounterEl = document.getElementById('ads-counter');
  const resetBtn = document.getElementById('btn-reset');
  
  let currentShortsCount = 0;
  let currentAdsCount = 0;

  // Animate counter from current count to target count
  function animateCounter(counterEl, start, end, onComplete) {
    if (!counterEl) return;
    if (start === end) {
      counterEl.textContent = end.toLocaleString();
      if (onComplete) onComplete(end);
      return;
    }

    const duration = 400; // milliseconds
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quadratic
      const easeProgress = progress * (2 - progress);
      const value = Math.floor(start + (end - start) * easeProgress);
      
      counterEl.textContent = value.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counterEl.textContent = end.toLocaleString();
        if (onComplete) onComplete(end);
      }
    }
    
    requestAnimationFrame(update);
  }

  // Load settings and display them
  function loadSettings() {
    chrome.storage.local.get([...keys, 'blockedCount', 'adsBlockedCount'], (res) => {
      // Set toggles
      keys.forEach(key => {
        const toggle = document.getElementById(key);
        if (toggle) {
          // Default to true if not defined yet
          const val = res[key] !== undefined ? res[key] : true;
          toggle.checked = val;
          
          // Save default values if they weren't in storage yet
          if (res[key] === undefined) {
            chrome.storage.local.set({ [key]: true });
          }
        }
      });

      // Set initial Shorts count
      const blockedCount = res.blockedCount || 0;
      currentShortsCount = blockedCount;
      if (shortsCounterEl) shortsCounterEl.textContent = blockedCount.toLocaleString();

      // Set initial Ads count
      const adsBlockedCount = res.adsBlockedCount || 0;
      currentAdsCount = adsBlockedCount;
      if (adsCounterEl) adsCounterEl.textContent = adsBlockedCount.toLocaleString();
    });
  }

  // Setup event listeners for checkboxes
  keys.forEach(key => {
    const toggle = document.getElementById(key);
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ [key]: e.target.checked });
      });
    }
  });

  // Reset button action
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all blocked/bypassed statistics?')) {
        chrome.storage.local.set({ blockedCount: 0, adsBlockedCount: 0 }, () => {
          animateCounter(shortsCounterEl, currentShortsCount, 0, (val) => currentShortsCount = val);
          animateCounter(adsCounterEl, currentAdsCount, 0, (val) => currentAdsCount = val);
        });
      }
    });
  }

  // Listen for storage changes (e.g. counter ticks from YouTube tabs)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.blockedCount) {
        const newCount = changes.blockedCount.newValue || 0;
        animateCounter(shortsCounterEl, currentShortsCount, newCount, (val) => currentShortsCount = val);
      }
      
      if (changes.adsBlockedCount) {
        const newCount = changes.adsBlockedCount.newValue || 0;
        animateCounter(adsCounterEl, currentAdsCount, newCount, (val) => currentAdsCount = val);
      }
      
      // Update check state if settings are updated elsewhere
      keys.forEach(key => {
        if (changes[key]) {
          const toggle = document.getElementById(key);
          if (toggle) {
            toggle.checked = changes[key].newValue;
          }
        }
      });
    }
  });

  // Initialize
  loadSettings();
});
