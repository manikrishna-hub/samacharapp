document.addEventListener("DOMContentLoaded", () => {

  // Read ?reel=ID from URL
  const params = new URLSearchParams(window.location.search);
  const reelId = params.get("reel");

  if (!reelId) return;

  // Find the reel element
  const reelEl = document.getElementById(`reel-${reelId}`);

  if (reelEl) {
    // Smooth scroll to reel
    reelEl.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    // Auto play video if exists
    const video = reelEl.querySelector("video");
    if (video) {
      video.play().catch(() => {});
    }
  }
});
