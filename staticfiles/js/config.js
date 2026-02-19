// config.js
window.DEBUG_MODE = true; // set to false in production
function debugLog(...args) {
  if (window.DEBUG_MODE) console.log("🐞", ...args);
}