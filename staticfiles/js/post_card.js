(() => {
  let mediaList = [];
  let mediaTypes = [];
  let currentIndex = 0;

  let startX = 0;
  let endX = 0;
  const SWIPE_THRESHOLD = 50;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.media-item').forEach(item => {
      item.addEventListener('click', () => openFromItem(item));
    });
  });

  function openFromItem(item) {
    const postId = item.dataset.postId;
    const index = parseInt(item.dataset.index, 10);

    const group = document.querySelector(
      `.media-group[data-post-id="${postId}"]`
    );
    if (!group) return;

    const data = JSON.parse(group.dataset.media);
    mediaList = data.map(d => d.src);
    mediaTypes = data.map(d => d.type);
    currentIndex = index;

    openModal();
  }

  function openModal() {
    render();
    const modal = document.getElementById('mediaModal');
    modal.classList.add('active');

    const content = document.getElementById('modalContent');
    content.addEventListener('touchstart', onTouchStart, { passive: true });
    content.addEventListener('touchend', onTouchEnd);
  }

  function render() {
    const content = document.getElementById('modalContent');
    content.innerHTML = '';

    const src = mediaList[currentIndex];
    const type = mediaTypes[currentIndex];

    if (type === 'video') {
      const v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.muted = true;
      v.playsInline = true;
      content.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = src;
      content.appendChild(img);
    }
  }

  function onTouchStart(e) {
    startX = e.changedTouches[0].clientX;
  }

  function onTouchEnd(e) {
    endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) < SWIPE_THRESHOLD) return;

    diff < 0 ? next() : prev();
  }

  function next() {
    if (mediaList.length < 2) return;
    currentIndex = (currentIndex + 1) % mediaList.length;
    render();
  }

  function prev() {
    if (mediaList.length < 2) return;
    currentIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    render();
  }

  window.closeMediaModal = function () {
    document.getElementById('mediaModal').classList.remove('active');
    document.getElementById('modalContent').innerHTML = '';
  };
})();
