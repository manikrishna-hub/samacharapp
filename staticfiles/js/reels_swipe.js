document.addEventListener("DOMContentLoaded", () => {

  const container = document.querySelector(".reels-container");
  if (!container) return;

  let isScrolling;
  
  container.addEventListener("scroll", () => {
    clearTimeout(isScrolling);

    isScrolling = setTimeout(() => {
      const reels = Array.from(container.querySelectorAll(".reel-card"));

      let closest = null;
      let minDiff = Infinity;

      reels.forEach(reel => {
        const rect = reel.getBoundingClientRect();
        const diff = Math.abs(rect.top);

        if (diff < minDiff) {
          minDiff = diff;
          closest = reel;
        }
      });

      if (closest) {
        closest.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 120); // momentum delay
  });

});
