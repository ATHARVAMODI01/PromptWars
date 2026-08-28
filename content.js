/* ==========================================================================
   YouTube Shorts Blocker - Content Script
   ========================================================================== */

// Default settings
let settings = {
  redirectShorts: true,
  hideSidebar: true,
  hideHome: true,
  hideSearch: true,
  hideGrid: true,
  blockVideoAds: true,
  blockDisplayAds: true
};

// Log helper
function log(msg) {
  console.log('[YT Cleaner] ' + msg);
}

// Apply classes to HTML tag for instant CSS-based hiding
function applySettingsHTMLClasses() {
  const html = document.documentElement;
  if (!html) return;

  const classes = {
    hideSidebar: 'yt-hide-sidebar-shorts',
    hideHome: 'yt-hide-home-shorts',
    hideSearch: 'yt-hide-search-shorts',
    hideGrid: 'yt-hide-grid-shorts',
    blockDisplayAds: 'yt-block-display-ads'
  };

  for (const [key, className] of Object.entries(classes)) {
    if (settings[key]) {
      html.classList.add(className);
    } else {
      html.classList.remove(className);
    }
  }
}

// Redirect YouTube Shorts video URLs to regular watch URLs
function checkRedirect() {
  if (!settings.redirectShorts) return;

  const pathname = window.location.pathname;
  if (pathname.startsWith('/shorts/')) {
    const videoId = pathname.split('/shorts/')[1]?.split('?')[0];
    if (videoId) {
      log('Redirecting Shorts video ' + videoId + ' to standard player.');
      // Reconstruct URL with watch query parameter
      const searchParams = window.location.search;
      const newUrl = window.location.origin + '/watch?v=' + videoId + (searchParams ? searchParams.replace('?', '&') : '');
      window.location.replace(newUrl);
    }
  }
}

// Count and mark blocked elements dynamically
let scanTimeout;
function scanAndCountBlocked() {
  let countThisScan = 0;

  // Configuration mapping for element checks
  const mappings = [
    { key: 'hideSidebar', selector: 'ytd-guide-entry-renderer:has(a[href*="/shorts"]), ytd-mini-guide-entry-renderer:has(a[href*="/shorts"]), ytd-guide-downloads-entry-renderer:has(a[href*="/shorts"]), a[href*="/shorts"]#endpoint' },
    { key: 'hideHome', selector: 'ytd-rich-shelf-renderer[is-shorts], ytd-rich-shelf-renderer:has(span[id="title"]:has(yt-icon[type="shorts"])), ytd-rich-shelf-renderer:has(a[href*="/shorts"]), ytd-rich-grid-row:has(> #contents > ytd-rich-shelf-renderer[is-shorts])' },
    { key: 'hideSearch', selector: 'ytd-reel-shelf-renderer, ytd-shelf-renderer:has(span[id="title"]:has(yt-icon[type="shorts"])), ytd-shelf-renderer:has(a[href*="/shorts"])' },
    { key: 'hideGrid', selector: 'ytd-rich-item-renderer:has(a[href*="/shorts/"]), ytd-grid-video-renderer:has(a[href*="/shorts/"]), ytd-video-renderer:has(a[href*="/shorts/"]), ytd-compact-video-renderer:has(a[href*="/shorts/"])' }
  ];

  mappings.forEach(({ key, selector }) => {
    if (settings[key]) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el.hasAttribute('data-shorts-blocked')) {
            el.setAttribute('data-shorts-blocked', 'true');
            countThisScan++;
          }
        });
      } catch (e) {
        // Ignore selector compilation/runtime errors (e.g. if :has support details differ)
      }
    }
  });

  if (countThisScan > 0) {
    chrome.storage.local.get({ blockedCount: 0 }, (res) => {
      chrome.storage.local.set({ blockedCount: res.blockedCount + countThisScan });
    });
  }
}

// Video Ad Blocker and Skipper Logic
let currentlyHandlingAd = false;
let lastAdCountTime = 0;
let originalPlaybackRate = 1;
let originalMuted = false;

// Simulate sequence of mouse events to bypass programmatic click blocks
function simulateClick(element) {
  if (!element) return;
  const events = ['mousedown', 'mouseup', 'click'];
  events.forEach(eventName => {
    const event = new MouseEvent(eventName, {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  });
}

function handleVideoAds() {
  if (!settings.blockVideoAds) return;

  const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
  const video = player?.querySelector('video') || document.querySelector('.html5-main-video') || document.querySelector('video');

  // Strictly check if an advertisement video is active on the player
  const isAdShowing = player?.classList.contains('ad-showing') || 
                      player?.classList.contains('ad-interrupting');

  // Find and automatically click any visible Skip button
  const skipSelectors = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    'button[aria-label="Skip ad"]',
    'button[aria-label="Skip Ads"]',
    '.ytp-ad-skip-button-slot',
    '.ytp-ad-skip-button-container',
    '.ytp-ad-skip-button-text',
    '[class*="ytp-ad-skip-button"]'
  ];

  for (const selector of skipSelectors) {
    const btn = document.querySelector(selector);
    // Ensure button exists and is visible (not display: none / hidden)
    if (btn && (btn.offsetParent !== null || btn.offsetWidth > 0 || btn.offsetHeight > 0)) {
      simulateClick(btn);
      log('Clicked skip button via selector: ' + selector);
      break;
    }
  }

  // Handle ad fast-forwarding, muting, and stats counting
  if (isAdShowing) {
    const now = Date.now();
    // Capture original state when ad starts
    if (!currentlyHandlingAd) {
      currentlyHandlingAd = true;
      log('Video ad detected. Muting and speeding up...');
      
      if (video) {
        originalPlaybackRate = video.playbackRate === 16.0 ? 1 : video.playbackRate;
        originalMuted = video.muted;
      }
      
      // Throttle stats increment
      if (now - lastAdCountTime > 2000) {
        lastAdCountTime = now;
        chrome.storage.local.get({ adsBlockedCount: 0 }, (res) => {
          chrome.storage.local.set({ adsBlockedCount: res.adsBlockedCount + 1 });
        });
      }
    }

    if (video) {
      // Mute audio instantly
      if (!video.muted) {
        video.muted = true;
      }
      
      // Speed up video to 16x speed
      if (video.playbackRate < 16.0) {
        video.playbackRate = 16.0;
      }

      // Skip to the end
      if (isFinite(video.duration) && video.currentTime < video.duration - 0.1) {
        video.currentTime = video.duration - 0.05;
      }
    }
  } else {
    // Ad finished or not showing
    if (currentlyHandlingAd) {
      currentlyHandlingAd = false;
      log('Video ad finished. Restoring player playback rate and volume.');
      
      if (video) {
        // Restore original playback rate (ensure it isn't set to 16)
        video.playbackRate = originalPlaybackRate === 16.0 ? 1.0 : originalPlaybackRate;
        // Restore original mute state
        video.muted = originalMuted;
      }
    }
  }
}

// Set up periodic and event-based checks for video ads
function setupVideoAdsListener() {
  setInterval(handleVideoAds, 200);

  // Hook directly into play and timeupdate on current and future video elements
  const hookVideo = (video) => {
    if (!video || video.dataset.adEventsHooked) return;
    video.dataset.adEventsHooked = 'true';
    video.addEventListener('play', handleVideoAds);
    video.addEventListener('timeupdate', handleVideoAds);
  };

  const currentVideo = document.querySelector('video');
  if (currentVideo) hookVideo(currentVideo);
}

// Initialize settings from storage
chrome.storage.local.get(
  ['redirectShorts', 'hideSidebar', 'hideHome', 'hideSearch', 'hideGrid', 'blockVideoAds', 'blockDisplayAds'],
  (res) => {
    // Override defaults with storage values if they exist
    if (res.redirectShorts !== undefined) settings.redirectShorts = res.redirectShorts;
    if (res.hideSidebar !== undefined) settings.hideSidebar = res.hideSidebar;
    if (res.hideHome !== undefined) settings.hideHome = res.hideHome;
    if (res.hideSearch !== undefined) settings.hideSearch = res.hideSearch;
    if (res.hideGrid !== undefined) settings.hideGrid = res.hideGrid;
    if (res.blockVideoAds !== undefined) settings.blockVideoAds = res.blockVideoAds;
    if (res.blockDisplayAds !== undefined) settings.blockDisplayAds = res.blockDisplayAds;

    // Apply settings and run check
    applySettingsHTMLClasses();
    checkRedirect();
    scanAndCountBlocked();
    setupVideoAdsListener();
  }
);

// Listen for settings changes from popup dashboard
chrome.storage.onChanged.addListener((changes) => {
  let settingsChanged = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (newValue !== undefined && key in settings) {
      settings[key] = newValue;
      settingsChanged = true;
    }
  }
  
  if (settingsChanged) {
    applySettingsHTMLClasses();
    checkRedirect();
    scanAndCountBlocked();
    handleVideoAds();
  }
});

// Run checks on page events
document.addEventListener('DOMContentLoaded', () => {
  applySettingsHTMLClasses();
  checkRedirect();
  scanAndCountBlocked();
  handleVideoAds();
});

// YouTube finishes SPA navigation
window.addEventListener('yt-navigate-finish', () => {
  checkRedirect();
  // Brief delay to allow DOM to build before scanning
  setTimeout(scanAndCountBlocked, 300);
  setTimeout(scanAndCountBlocked, 800);
  handleVideoAds();
});

// Setup MutationObserver to dynamically monitor DOM content loading
const observer = new MutationObserver(() => {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => {
    scanAndCountBlocked();
    checkRedirect();
    
    // Dynamically hook video element if it changed/loaded
    const video = document.querySelector('video');
    if (video && !video.dataset.adEventsHooked) {
      video.dataset.adEventsHooked = 'true';
      video.addEventListener('play', handleVideoAds);
      video.addEventListener('timeupdate', handleVideoAds);
    }
  }, 150);
  
  // Instantly handle ads without waiting for timeout if ad is detected in DOM changes
  handleVideoAds();
});

// Start observer
observer.observe(document.documentElement || document.body || document, {
  childList: true,
  subtree: true
});
