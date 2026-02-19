document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".status-slide");
  const bars = document.querySelectorAll(".progress-fill");

  let current = 0;
  let duration = 5000; // default 5 seconds
  let rafId = null;

  function showSlide(index) {
    // reset slides
    slides.forEach(s => {
      s.classList.remove("active");
      const v = s.querySelector("video");
      if (v) v.pause();
    });

    // reset bars
    bars.forEach(b => (b.style.width = "0%"));

    slides[index].classList.add("active");

    playMedia(index);
    animateBar(index);
  }

  function animateBar(index) {
    let start = null;

    function step(timestamp) {
      if (!start) start = timestamp;

      const progress = timestamp - start;
      const percent = Math.min((progress / duration) * 100, 100);
      bars[index].style.width = percent + "%";

      if (progress < duration) {
        rafId = requestAnimationFrame(step);
      } else {
        next();
      }
    }

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(step);
  }

  function playMedia(index) {
    const slide = slides[index];
    const mediaBox = slide.querySelector(".viewer-media");
    const type = mediaBox.dataset.type;
    const video = slide.querySelector("video");

    if (type === "video" && video) {
      video.currentTime = 0;
      video.play();

      // wait until video metadata is ready
      video.onloadedmetadata = () => {
        duration = video.duration * 1000;
      };
    } else {
      duration = 5000; // image
    }
  }

  function next() {
    if (current < slides.length - 1) {
      current++;
      showSlide(current);
    }
  }

  // START
  showSlide(current);

  // TAP RIGHT SIDE → NEXT
  document.addEventListener("click", (e) => {
    if (e.clientX > window.innerWidth / 2) {
      next();
    }
  });
});
