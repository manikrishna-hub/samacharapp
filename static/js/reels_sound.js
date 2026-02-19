// static/js/reels_sound.js
console.log("🔊 Reels sound (mobile-safe) loaded");

document.addEventListener("DOMContentLoaded", () => {

  let activeVideo = null;

  document.querySelectorAll(".reel-card").forEach(reel => {

    const video = reel.querySelector("video");
    const indicator = reel.querySelector(".sound-indicator");

    if (!video || !indicator) return;

    video.muted = true;
    video.volume = 1;
    video.playsInline = true;

    const enableSound = () => {

      if (activeVideo && activeVideo !== video) {
        activeVideo.muted = true;
        activeVideo.classList.remove("sound-on");
      }

      // ✅ USER GESTURE ZONE
      video.muted = false;

      video.play().then(() => {
        video.classList.add("sound-on");
        activeVideo = video;
      }).catch(err => {
        console.warn("Audio blocked:", err);
      });
    };

    const disableSound = () => {
      video.muted = true;
      video.classList.remove("sound-on");
      activeVideo = null;
    };

    indicator.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      video.muted ? enableSound() : disableSound();
    });

    indicator.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();

      video.muted ? enableSound() : disableSound();
    }, { passive: false });

  });
});
