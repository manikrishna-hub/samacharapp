// static/js/reels_comment.js
console.log("💬 Reels comments – Realme FINAL FIX");

document.addEventListener("DOMContentLoaded", () => {

  const container = document.querySelector(".reels-container");

  /* ================= OPEN COMMENTS ================= */
  document.addEventListener(
    "touchstart",
    (e) => {
      const btn = e.target.closest(".comment-btn");
      if (!btn) return;

      // 🔥 STOP REALME SCROLL CAPTURE
      e.preventDefault();
      e.stopImmediatePropagation();

      const reel = btn.closest(".reel-card");
      if (!reel) return;

      const panel = reel.querySelector(".reel-comments");
      if (!panel) return;

      // Lock scroll
      container.style.overflowY = "hidden";

      // Pause video
      const video = reel.querySelector("video");
      if (video) {
        video.pause();
        video.muted = true;
      }

      panel.classList.remove("hidden");
    },
    { passive: false, capture: true } // 🔥 CRITICAL
  );

  /* ================= CLOSE COMMENTS ================= */
  document.addEventListener(
    "touchstart",
    (e) => {
      const btn = e.target.closest(".close-comments");
      if (!btn) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const panel = btn.closest(".reel-comments");
      if (!panel) return;

      panel.classList.add("hidden");

      // Restore scroll
      container.style.overflowY = "scroll";

      const reel = panel.closest(".reel-card");
      const video = reel?.querySelector("video");
      if (video) video.play().catch(() => {});
    },
    { passive: false, capture: true }
  );

  /* ================= DESKTOP ================= */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".comment-btn");
    if (btn) btn.dispatchEvent(new TouchEvent("touchstart"));

    const close = e.target.closest(".close-comments");
    if (close) close.dispatchEvent(new TouchEvent("touchstart"));
  });
});
