document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();

      if (!confirm("Delete this reel?")) return;

      const reelId = btn.dataset.reelId;
      const csrf = document.getElementById("csrf-token").value;

      fetch(`/reels/delete/${reelId}/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrf
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById(`reel-${reelId}`).remove();
        }
      });
    });
  });
});
