document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".share-btn").forEach(btn => {

    btn.addEventListener("click", () => {
      const reelId = btn.dataset.reelId;
      const reelUrl = `${window.location.origin}/reels/?reel=${reelId}`;

      navigator.clipboard.writeText(reelUrl)
        .then(() => {
          // Simple feedback
          btn.classList.add("copied");
          setTimeout(() => btn.classList.remove("copied"), 1000);
        })
        .catch(err => console.error("Share error:", err));
    });

  });

});
