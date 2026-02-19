document.addEventListener("DOMContentLoaded", function () {

    // ===== POSTS COLLECTION =====
    window.postElements = document.querySelectorAll("#postsSection > div");
    window.currentPostIndex = 0;

    const modal = document.getElementById("postModal");

    // ===== TABS =====
    const postsTab = document.getElementById("postsTab");
    const reelsTab = document.getElementById("reelsTab");
    const postsSection = document.getElementById("postsSection");
    const reelsSection = document.getElementById("reelsSection");

    if (postsTab && reelsTab) {

        postsTab.addEventListener("click", function () {
            postsSection.classList.remove("hidden");
            reelsSection.classList.add("hidden");

            postsTab.classList.add("border-black", "text-black");
            postsTab.classList.remove("text-gray-400");

            reelsTab.classList.remove("border-black", "text-black");
            reelsTab.classList.add("text-gray-400");
        });

        reelsTab.addEventListener("click", function () {
            reelsSection.classList.remove("hidden");
            postsSection.classList.add("hidden");

            reelsTab.classList.add("border-black", "text-black");
            reelsTab.classList.remove("text-gray-400");

            postsTab.classList.remove("border-black", "text-black");
            postsTab.classList.add("text-gray-400");
        });
    }

    // ===== ESC KEY CLOSE =====
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closePostModal();
        }
    });

    // ===== SWIPE SUPPORT =====
    if (modal) {
        let startX = 0;

        modal.addEventListener("touchstart", function (e) {
            startX = e.changedTouches[0].screenX;
        });

        modal.addEventListener("touchend", function (e) {
            let endX = e.changedTouches[0].screenX;

            if (endX < startX - 50) nextPost();
            if (endX > startX + 50) prevPost();
        });
    }

});


// ===== OPEN MODAL =====
function openPostModal(index) {
    window.currentPostIndex = index;

    const modal = document.getElementById("postModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    showPost(window.currentPostIndex);
}

// ===== CLOSE =====
function closePostModal() {
    const modal = document.getElementById("postModal");
    if (modal) modal.classList.add("hidden");
}

// ===== SHOW POST =====
function showPost(index) {

    const modalContent = document.getElementById("postModalContent");
    if (!modalContent) return;

    modalContent.innerHTML = "";

    if (!window.postElements.length) return;

    const clickedPost = window.postElements[index];
    if (!clickedPost) return;

    const media = clickedPost.querySelector("img, video");
    if (!media) return;

    const clone = media.cloneNode(true);

    clone.classList.remove("h-40");
    clone.classList.add("max-h-[80vh]", "rounded-lg");

    if (clone.tagName === "VIDEO") {
        clone.controls = true;
        clone.muted = false;
    }

    modalContent.appendChild(clone);
}

// ===== NEXT =====
function nextPost() {
    if (!window.postElements.length) return;

    window.currentPostIndex =
        (window.currentPostIndex + 1) % window.postElements.length;

    showPost(window.currentPostIndex);
}

// ===== PREVIOUS =====
function prevPost() {
    if (!window.postElements.length) return;

    window.currentPostIndex =
        (window.currentPostIndex - 1 + window.postElements.length) %
        window.postElements.length;

    showPost(window.currentPostIndex);
}
