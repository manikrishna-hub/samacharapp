// static/js/reels_autoplay.js
console.log("🎬 Reels autoplay (mobile safe)");

document.addEventListener("DOMContentLoaded", () => {
  let activeVideo = null;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;

      if (entry.isIntersecting) {

        if (activeVideo && activeVideo !== video) {
          activeVideo.pause();
        }

        // ✅ ALWAYS muted for autoplay
        video.muted = true;

        // autoplay allowed when muted
        video.play().catch(() => {});

        activeVideo = video;

      } else {
        video.pause();
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll(".reel-video").forEach(video => {
    observer.observe(video);
  });
});
