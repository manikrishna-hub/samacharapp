document.addEventListener("DOMContentLoaded", () => {

  const reels = document.querySelectorAll(".reel");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const reel = entry.target;
      const video = reel.querySelector("video");
      if (!video) return;

      if (entry.intersectionRatio >= 0.75) {
        // ▶️ Play only when MOSTLY visible
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else {
        // ⏸️ Pause when less visible
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, {
    threshold: [0.25, 0.75]
  });

  reels.forEach(reel => observer.observe(reel));

});
