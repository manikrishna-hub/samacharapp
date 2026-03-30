// ================= MEDIA MODAL SYSTEM =================

let modalMedia = [];
let modalIndex = 0;

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("media-item")) {

        const container = e.target.closest(".media-group");
        if (!container) return;

        modalMedia = JSON.parse(container.dataset.media);
        modalIndex = parseInt(e.target.dataset.index);

        openModal();
    }
});


function openModal() {
    const modal = document.getElementById("mediaModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    document.body.style.overflow = "hidden";

    renderMedia();
}

function closeModal() {
    const modal = document.getElementById("mediaModal");
    if (!modal) return;

    modal.classList.add("hidden");
    modal.classList.remove("flex");

    document.body.style.overflow = "auto";

    document.getElementById("modalContent").innerHTML = "";
}

function renderMedia() {
    const media = modalMedia[modalIndex];
    const container = document.getElementById("modalContent");
    if (!media || !container) return;

    if (media.type === "video") {
        container.innerHTML = `
            <video controls autoplay class="max-h-[80vh] rounded-lg">
                <source src="${media.src}">
            </video>`;
    } else {
        container.innerHTML = `
            <img src="${media.src}" class="max-h-[80vh] rounded-lg">`;
    }
}

function nextModal() {
    modalIndex = (modalIndex + 1) % modalMedia.length;
    renderMedia();
}

function prevModal() {
    modalIndex = (modalIndex - 1 + modalMedia.length) % modalMedia.length;
    renderMedia();
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeModal();
    }
});

// ================ ring function=======================

let ringtone;

function playRingtone() {
  ringtone = new Audio("/static/sounds/ring.mp3");
  ringtone.loop = true;
  ringtone.play().catch(() => {});
}

function stopRingtone() {
  if (ringtone) {
    ringtone.pause();
    ringtone.currentTime = 0;
  }
}

// ================= Incoming Call Popup =================

let callPopupActive = false;

document.addEventListener("DOMContentLoaded", function () {

    console.log("CALL POPUP SCRIPT STARTED");

    const callPopup = document.getElementById("incoming-call");
    const callerName = document.getElementById("caller-name");
    const acceptBtn = document.getElementById("accept-call");
    const rejectBtn = document.getElementById("reject-call");

    if (!callPopup) return;

    let currentConv = null;

    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

    const callSocket = new WebSocket(
        protocol + window.location.host + "/ws/call/"
    );

	callSocket.onmessage = function(e){

    const data = JSON.parse(e.data);
    console.log("📞 CALL EVENT:", data);

    // ===== Incoming Call =====
    if(data.type === "incoming_call"){

        if(callPopupActive) return;

        callPopupActive = true;
        currentConv = data.conv_id;

        callerName.innerText = (data.caller || "Someone") + " is calling";
        callPopup.style.display = "block";

        playRingtone(); // ✅ FIXED (use your function)
    }

    // ===== Call Accepted =====
    if (data.type === "call.accept") {
        console.log("✅ Call accepted");

        stopRingtone(); // 🔥 VERY IMPORTANT

        const status = document.getElementById("callingStatus");
        if (status) status.innerText = "Connected";
    }

    // ===== End / Reject / Missed =====
    if(
        data.type === "call.end" ||
        data.type === "call.rejected" ||
        data.type === "call.missed"
    ){

        callPopup.style.display = "none";
        callPopupActive = false;

        stopRingtone(); // ✅ FIXED

        // optional: redirect if needed
        // window.location.href = "/chat/";
    }
};


    // ===== Accept =====
    if (acceptBtn) {
    acceptBtn.onclick = function(){
        if(currentConv){

            // ✅ SEND ACCEPT SIGNAL
            callSocket.send(JSON.stringify({
                type: "call.accept",
                conv_id: currentConv
            }));

            // then redirect
            window.location.href =
                "/chat/call/" + currentConv + "/?type=audio";
        }
    };
}
    // ===== Reject =====
    if (rejectBtn) {
        rejectBtn.onclick = function(){

            callSocket.send(JSON.stringify({
                type:"call.rejected",
                conv_id: currentConv
            }));

            callPopup.style.display = "none";
            callPopupActive = false;
        };
    }

});