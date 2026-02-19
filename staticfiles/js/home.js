document.addEventListener('DOMContentLoaded', () => {

  /* ================= CSRF ================= */
  function getCSRFToken() {
    const el = document.querySelector('[name=csrfmiddlewaretoken]');
    return el ? el.value : '';
  }

  /* ================= TOGGLE COMMENTS ================= */
  window.toggleComments = function (postId) {
    const form = document.getElementById(`comment-form-${postId}`);
    const list = document.getElementById(`comments-${postId}`);
    if (form) form.classList.toggle('hidden');
    if (list) list.classList.toggle('hidden');
  };

  /* ================= MEDIA / SWIPE ================= */
  let mediaList = [];
  let mediaTypes = [];
  let currentIndex = 0;
  let startX = 0;

  document.querySelectorAll('.media-item').forEach(item => {
    item.addEventListener('click', () => {
      const postId = item.dataset.postId;
      const index = Number(item.dataset.index);

      const group = document.querySelector(
        `.media-group[data-post-id="${postId}"]`
      );
      if (!group) return;

      const data = JSON.parse(group.dataset.media);
      mediaList = data.map(m => m.src);
      mediaTypes = data.map(m => m.type);
      currentIndex = index;

      openModal();
    });
  });

  function openModal() {
    renderMedia();
    document.getElementById('mediaModal').classList.add('active');
  }

  function renderMedia() {
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

  window.nextMedia = () => {
    if (mediaList.length < 2) return;
    currentIndex = (currentIndex + 1) % mediaList.length;
    renderMedia();
  };

  window.prevMedia = () => {
    if (mediaList.length < 2) return;
    currentIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    renderMedia();
  };

  window.closeMediaModal = () => {
    document.getElementById('mediaModal').classList.remove('active');
    document.getElementById('modalContent').innerHTML = '';
  };

  const modal = document.getElementById('mediaModal');
  const content = document.getElementById('modalContent');

  modal.addEventListener('click', e => {
    if (e.target.id === 'mediaModal') closeMediaModal();
  });

  content.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });

  content.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) < 50) return;
    diff < 0 ? nextMedia() : prevMedia();
  });

  /* ================= LIKE ================= */
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.postId;

      fetch(`/post/${postId}/like/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() }
      })
      .then(r => r.json())
      .then(d => {
        btn.querySelector('.like-count').textContent = d.count;
        btn.classList.toggle('liked', d.liked);
      });
    });
  });

  /* ================= COMMENTS ================= */
  document.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const postId = form.dataset.postId;
      const input = form.querySelector('input');

      fetch(`/post/${postId}/comment/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
        body: new URLSearchParams({ text: input.value })
      })
      .then(r => r.json())
      .then(d => {
        document.getElementById(`comments-${postId}`)
          .insertAdjacentHTML(
            'beforeend',
            `<p class="text-xs"><b>${d.user}</b> ${d.text}</p>`
          );
        input.value = '';
      });
    });
  });

  /* ================= SHARE ================= */
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = window.location.origin + btn.dataset.url;
      navigator.share ? navigator.share({ url }) :
        navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
    });
  });

});
