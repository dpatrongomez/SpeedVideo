/**
 * Content script for SpeedVideo Chrome Extension.
 * Injected into all web pages. Listens for messages from the popup
 * and applies playback rate changes to all <video> elements in the DOM.
 */

let currentSpeed = 1.0;
let isEnabled = true;

/**
 * Apply the current speed to all video elements on the page.
 */
function applySpeedToVideos(speed: number) {
  const videos = document.querySelectorAll<HTMLVideoElement>('video');
  videos.forEach((video) => {
    video.playbackRate = speed;
  });
}

/**
 * Observe dynamically injected video elements (e.g., YouTube SPA navigation).
 */
const observer = new MutationObserver(() => {
  if (isEnabled) {
    applySpeedToVideos(currentSpeed);
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

/**
 * Also apply speed whenever a video starts playing (handles SPA route changes).
 */
document.addEventListener(
  'play',
  (e) => {
    if (isEnabled && e.target instanceof HTMLVideoElement) {
      e.target.playbackRate = currentSpeed;
    }
  },
  true
);

/**
 * Keyboard shortcuts: S = slow down (-0.1x), D = speed up (+0.1x).
 * Only fires when target is not an input/textarea.
 */
document.addEventListener('keydown', (e) => {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

  if (e.key === 'd' || e.key === 'D') {
    currentSpeed = Math.min(5.0, parseFloat((currentSpeed + 0.1).toFixed(1)));
    if (isEnabled) applySpeedToVideos(currentSpeed);
    // Notify popup of change
    chrome.runtime.sendMessage({ type: 'SPEED_CHANGED', speed: currentSpeed }).catch(() => {});
  } else if (e.key === 's' || e.key === 'S') {
    currentSpeed = Math.max(0.1, parseFloat((currentSpeed - 0.1).toFixed(1)));
    if (isEnabled) applySpeedToVideos(currentSpeed);
    chrome.runtime.sendMessage({ type: 'SPEED_CHANGED', speed: currentSpeed }).catch(() => {});
  }
});

/**
 * Listen for messages from the popup.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SET_SPEED') {
    currentSpeed = message.speed;
    if (isEnabled) applySpeedToVideos(currentSpeed);
    sendResponse({ ok: true });
  } else if (message.type === 'SET_ENABLED') {
    isEnabled = message.enabled;
    if (!isEnabled) {
      // Reset all videos to normal speed
      document.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
        v.playbackRate = 1.0;
      });
    } else {
      applySpeedToVideos(currentSpeed);
    }
    sendResponse({ ok: true });
  } else if (message.type === 'GET_SPEED') {
    sendResponse({ speed: currentSpeed, enabled: isEnabled });
  }
  return true; // Keep the message channel open for async response
});
