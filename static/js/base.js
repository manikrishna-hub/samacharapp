// ================= MEDIA MODAL SYSTEM =================

let currentMedia = [];
let currentIndex = 0;

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("media-item")) {

        const container = e.target.closest(".media-group");
        if (!container) return;

        currentMedia = JSON.parse(container.dataset.media);
        currentIndex = parseInt(e.target.dataset.index);

        openModal();
    }
});

function openModal() {
    const modal = document.getElementById("mediaModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    document.body.style.overflow = "hidden"; // 🔥 prevent background scroll

    renderMedia();
}

function closeModal() {
    const modal = document.getElementById("mediaModal");
    if (!modal) return;

    modal.classList.add("hidden");
    modal.classList.remove("flex");

    document.body.style.overflow = "auto"; // 🔥 restore scroll

    document.getElementById("modalContent").innerHTML = "";
}

function renderMedia() {
    const media = currentMedia[currentIndex];
    const container = document.getElementById("modalContent");
    if (!media || !container) return;

    if (media.type === "video") {
        container.innerHTML = `
            <video controls autoplay class="max-h-[80vh] rounded-lg">
                <source src="${media.src}">
            </video>`;
    } else {
        container.innerHTML = `
            <img src="${media.src}"
                 class="max-h-[80vh] rounded-lg">`;
    }
}

function nextModal() {
    currentIndex = (currentIndex + 1) % currentMedia.length;
    renderMedia();
}

function prevModal() {
    currentIndex = (currentIndex - 1 + currentMedia.length) % currentMedia.length;
    renderMedia();
}


// ================= ESC KEY SUPPORT =================

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeModal();
    }
});


// ================= SWIPE SUPPORT (MOBILE) =================

let touchStartX = 0;
let touchEndX = 0;

const modalElement = document.getElementById("mediaModal");

if (modalElement) {
    modalElement.addEventListener("touchstart", function (e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    modalElement.addEventListener("touchend", function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance > 50) {
        prevModal();
    } else if (swipeDistance < -50) {
        nextModal();
    }
}
