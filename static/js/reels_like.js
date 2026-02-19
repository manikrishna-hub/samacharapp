document.addEventListener("DOMContentLoaded", () => {

  const csrfToken = document.getElementById("csrf-token")?.value;

  document.querySelectorAll(".like-btn").forEach(btn => {

    btn.addEventListener("click", (e) => {
      e.preventDefault();       // ✅ stop default
      e.stopPropagation();      // ✅ CRITICAL FIX

      const reelId = btn.dataset.reelId;

      fetch(`/reels/like/${reelId}/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json"
        }
      })
      .then(res => res.json())
      .then(data => {
        btn.querySelector(".count").innerText = data.likes;

        if (data.liked) {
          btn.classList.add("liked");
        } else {
          btn.classList.remove("liked");
        }
      })
      .catch(err => console.error("Like error", err));
    });

  });
});
