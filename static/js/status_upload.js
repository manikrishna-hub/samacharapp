document.addEventListener("DOMContentLoaded", () => {
  const mediaInput = document.getElementById("mediaInput");
  const mediaPreview = document.getElementById("mediaPreview");
  const postBtn = document.getElementById("postBtn");

  if (!mediaInput || !mediaPreview || !postBtn) return;

  mediaInput.addEventListener("change", () => {
    const file = mediaInput.files[0];
    if (!file) return;

    mediaPreview.innerHTML = "";
    mediaPreview.classList.remove("text-gray-400");
    mediaPreview.classList.add("border-green-400");

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url;
      img.className = "w-full h-full object-contain";
      img.onload = () => URL.revokeObjectURL(url);
      mediaPreview.appendChild(img);
    }

    else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = url;
      video.className = "w-full h-full object-contain";
      video.controls = true;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.onloadeddata = () => URL.revokeObjectURL(url);
      mediaPreview.appendChild(video);
    }

    postBtn.disabled = false;
    postBtn.classList.remove("bg-green-400", "cursor-not-allowed");
    postBtn.classList.add("bg-green-600", "hover:bg-green-700", "cursor-pointer");
  });
});
