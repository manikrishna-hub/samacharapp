document.addEventListener("DOMContentLoaded", () => {

  let lastTap = 0;

  document.querySelectorAll(".reel").forEach(reel => {

    reel.addEventListener("touchend", (e) => {
      e.preventDefault();

      const now = Date.now();
      const tapGap = now - lastTap;

      if (tapGap < 300 && tapGap > 0) {

        // ❤️ Heart animation
        const heart = reel.querySelector(".double-heart");
        heart.classList.add("show");
        setTimeout(() => heart.classList.remove("show"), 600);

        // 👍 Use SAME like logic
        const likeBtn = reel.querySelector(".like-btn");
        if (likeBtn && !likeBtn.classList.contains("liked")) {
          likeBtn.click(); // ✅ FIXES COUNT ISSUE
        }
      }

      lastTap = now;
    }, { passive: false });

  });

});
