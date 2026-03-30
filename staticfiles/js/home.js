/* =====================================================
   CSRF TOKEN
===================================================== */
function getCSRFToken() {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
}

/* =====================================================
   GLOBAL MEDIA VARIABLES
===================================================== */
let mediaList = [];
let mediaTypes = [];
let currentIndex = 0;

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("mediaModal");
    const modalContent = document.getElementById("modalContent");

    /* ================= COMMENTS ================= */
    window.toggleComments = function (postId) {
        const box = document.getElementById(`comments-${postId}`);
        if (box) box.classList.toggle("hidden");
    };

    /* ================= POST MENU ================= */
    window.toggleMenu = function (postId) {
        const currentMenu = document.getElementById(`menu-${postId}`);

        document.querySelectorAll(".post-dropdown").forEach(menu => {
            if (menu !== currentMenu) menu.classList.add("hidden");
        });

        currentMenu?.classList.toggle("hidden");
    };

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".post-menu-container")) {
            document.querySelectorAll(".post-dropdown").forEach(menu => {
                menu.classList.add("hidden");
            });
        }
    });

    /* ================= LIKE ================= */
    document.addEventListener("click", function (e) {
        const likeBtn = e.target.closest(".like-btn");
        if (!likeBtn) return;

        fetch(likeBtn.dataset.likeUrl, {
            method: "POST",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
        .then(res => res.json())
        .then(data => {
            likeBtn.classList.toggle("liked", data.liked);
            const countSpan = likeBtn.querySelector(".like-count");
            if (countSpan) countSpan.textContent = data.count;
        });
    });

    /* ================= SHARE ================= */
    document.addEventListener("click", function (e) {
        const shareBtn = e.target.closest(".share-btn");
        if (!shareBtn) return;

        const url = window.location.origin + shareBtn.dataset.url;

        if (navigator.share) {
            navigator.share({ url });
        } else {
            navigator.clipboard.writeText(url)
                .then(() => alert("Link copied!"));
        }
    });

    /* ================= OPEN MODAL ================= */
    document.addEventListener("click", function (e) {

        const item = e.target.closest(".media-item");
        if (!item) return;

        const group = item.closest(".media-group");
        if (!group) return;

        const data = JSON.parse(group.dataset.media);

        mediaList = data.map(m => m.src);
        mediaTypes = data.map(m => m.type);

        currentIndex = Number(item.dataset.index);

        openModal();
    });

    /* ================= RENDER MEDIA ================= */
    function renderMedia() {

        modalContent.innerHTML = "";

        const src = mediaList[currentIndex];
        const type = mediaTypes[currentIndex];

        if (!src) return;

        if (type === "video") {
            const video = document.createElement("video");
            video.src = src;
            video.controls = true;
            video.autoplay = true;
            video.playsInline = true;
            video.style.maxHeight = "90vh";
            modalContent.appendChild(video);
        } else {
            const img = document.createElement("img");
            img.src = src;
            img.style.maxHeight = "90vh";
            modalContent.appendChild(img);
        }
    }

    /* ================= OPEN ================= */
    window.openModal = function () {
        renderMedia();
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    /* ================= NEXT ================= */
    window.nextMedia = function () {
        if (mediaList.length < 2) return;
        currentIndex = (currentIndex + 1) % mediaList.length;
        renderMedia();
    };

    /* ================= PREVIOUS ================= */
    window.prevMedia = function () {
        if (mediaList.length < 2) return;
        currentIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
        renderMedia();
    };

    /* ================= CLOSE ================= */
    window.closeMediaModal = function () {
        const video = modalContent.querySelector("video");
        if (video) {
            video.pause();
            video.src = "";
        }

        modal.classList.remove("active");
        modalContent.innerHTML = "";
        document.body.style.overflow = "auto";
    };

    /* ================= CLICK OUTSIDE CLOSE ================= */
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            closeMediaModal();
        }
    });

    /* ================= ESC CLOSE ================= */
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeMediaModal();
        }
    });

});
