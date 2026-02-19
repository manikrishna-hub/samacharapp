document.addEventListener("DOMContentLoaded", () => {

  const reels = document.querySelectorAll(".reel");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const reel = entry.target;
      const viewed = reel.dataset.viewed;
      const reelId = reel.dataset.reelId;

      if (viewed === "true") return;

      fetch(`${window.location.origin}/reels/view/${reelId}/`)
        .then(res => res.json())
        .then(data => {
          reel.dataset.viewed = "true";

          const viewEl = reel.querySelector(".view-count");
          if (viewEl) {
            viewEl.innerText = data.views;
           
          //----Animations-----//
          viewEl.classList.add("pop");
           setTimeout(() => viewEl.classList.remove("pop"), 300);
          }

          observer.unobserve(reel);
        })
        .catch(err => console.error("View error:", err));
    });
  }, {
    threshold: 0.5
  });

  reels.forEach(reel => observer.observe(reel));

});
