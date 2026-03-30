// static/js/otp.js

document.addEventListener("DOMContentLoaded", function () {

    const inputs = document.querySelectorAll(".otp-box");
    const hidden = document.getElementById("otp");

    // 🔥 Auto move + collect OTP
    inputs.forEach((input, index) => {
        input.addEventListener("input", () => {

            if (input.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            hidden.value = Array.from(inputs).map(i => i.value).join("");
        });
    });

    // 🔥 Timer
    let time = 60;
    const timerEl = document.getElementById("timer");
    const resendBtn = document.getElementById("resend");

    resendBtn.style.pointerEvents = "none";
    resendBtn.style.color = "gray";

    const countdown = setInterval(() => {
        time--;
        timerEl.innerText = time;

        if (time <= 0) {
            clearInterval(countdown);
            resendBtn.style.pointerEvents = "auto";
            resendBtn.style.color = "blue";
        }
    }, 1000);

});