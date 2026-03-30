console.log("📞 SFU Call Loaded");

const socket = io("http://127.0.0.1:3000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on("connect", async () => {

  console.log("✅ Connected:", socket.id);

  if (typeof stopRingtone === "function") {
    stopRingtone();
  }

  socket.emit("joinRoom", { roomId }, async (data) => {

    device = new mediasoupClient.Device();

    await device.load({
      routerRtpCapabilities: data.rtpCapabilities
    });

    console.log("🎯 Device Loaded");

    await createRecvTransport();
    await createSendTransport();

    if (data.existingProducers?.length) {
      data.existingProducers.forEach(id => consumeProducer(id));
    }

  });

});

// 🔥 WebSocket (call signaling)
const protocol = location.protocol === "https:" ? "wss://" : "ws://";
const callSignalSocket = new WebSocket(protocol + location.host + "/ws/call/");

let device;
let sendTransport;
let recvTransport;
let localStream;
let pendingProducers = [];

let timerInterval;
let seconds = 0;

const dataEl = document.getElementById("chat-data").dataset;
const roomId = dataEl.convId;

const callType =
  new URLSearchParams(window.location.search).get("type") || "audio";

const localVideo = document.getElementById("localVideo");
const remoteContainer = document.getElementById("remoteContainer");
const hangupBtn = document.getElementById("hangupBtn");


/* ================= CONNECT ================= */


/* ================= LOCAL STREAM ================= */

async function getLocalStream() {

  try {

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: callType === "video"
    });

  } catch (err) {

    console.error("Microphone access error:", err);
    alert("Microphone permission required for calls.");
    return;

  }

  console.log("🎤 Local tracks:", localStream.getTracks());

  const audioTrack = localStream.getAudioTracks()[0];

  console.log("Mic enabled:", audioTrack.enabled);
  console.log("Mic muted:", audioTrack.muted);
  console.log("Mic label:", audioTrack.label);

  if (callType === "video") {
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    await localVideo.play();
  }

}

/* ================= SEND TRANSPORT ================= */

async function createSendTransport() {

  socket.emit("createTransport", { roomId }, async (params) => {

    sendTransport = device.createSendTransport(params);

    console.log("🚀 Send transport:", sendTransport.id);

    sendTransport.on("connect", ({ dtlsParameters }, callback) => {

      socket.emit("connectTransport", {
        transportId: sendTransport.id,
        dtlsParameters
      }, callback);

    });

    sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {

      socket.emit("produce", {
        transportId: sendTransport.id,
        kind,
        rtpParameters
      }, ({ id }) => {
        callback({ id });
      });

    });

    // 🎤 get mic
    await getLocalStream();

    // ✅ FIXED (no crash now)
    const controls = document.getElementById("activeControls");
    if (controls) controls.hidden = false;

    if (!localStream) return;

    // 🎧 send audio/video
    for (const track of localStream.getTracks()) {
      console.log("Producing track:", track.kind);
      await sendTransport.produce({ track });
    }

    console.log("🎥 Producing media");

  });

}

/* ================= RECEIVE TRANSPORT ================= */

async function createRecvTransport() {


  socket.emit("createTransport", { roomId }, async (params) => {

    recvTransport = device.createRecvTransport(params);

    console.log("📡 Recv transport:", recvTransport.id);

    recvTransport.on("connect", ({ dtlsParameters }, callback) => {

      socket.emit("connectTransport", {
        transportId: recvTransport.id,
        dtlsParameters
      }, callback);

    });

    // consume producers that arrived early
    pendingProducers.forEach(id => consumeProducer(id));
    pendingProducers = [];

  });

}

/* ================= CONSUME ================= */
async function consumeProducer(producerId) {

  if (!recvTransport) {
    pendingProducers.push(producerId);
    return;
  }

  socket.emit("consume", {
    producerId,
    rtpCapabilities: device.rtpCapabilities
  }, async (params) => {

    const consumer = await recvTransport.consume(params);
    const stream = new MediaStream([consumer.track]);

    await consumer.resume();

    console.log("Consumer kind:", consumer.kind);

    if (consumer.kind === "video") {

      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.className = "remote-video";

      remoteContainer.appendChild(video);

    } else if (consumer.kind === "audio") {

      const audio = document.createElement("audio");

      audio.srcObject = stream;
      audio.autoplay = true;
      audio.playsInline = true;
      audio.muted = false;

      audio.onloadedmetadata = async () => {
        try {
          await audio.play();
          console.log("🔊 Audio playing OK");
        } catch (err) {
          console.log("❌ Audio blocked:", err);
        }
      };

      remoteContainer.appendChild(audio);
    }

    // ✅ START TIMER HERE (CORRECT PLACE)
    if (!timerInterval) {
      document.getElementById("callingStatus").innerText = "Connected";
      startTimer();
    }

    console.log("🎧 Consuming:", producerId);

  });
}

/* ================= NEW PRODUCER ================= */

socket.on("newProducer", ({ producerId }) => {

  console.log("🔥 New producer:", producerId);

  if (!recvTransport) {
    pendingProducers.push(producerId);
    return;
  }

  consumeProducer(producerId);

});

/* ================= END CALL ================= */

let callEnded = false;

function endCall() {

  if (callEnded) return;
  callEnded = true;

  console.log("📴 Ending call...");

  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 0;

  if (callSignalSocket.readyState === WebSocket.OPEN) {
    callSignalSocket.send(JSON.stringify({
      type: "call.end",
      conv_id: roomId
    }));
  }

  sendTransport?.close();
  recvTransport?.close();
  localStream?.getTracks().forEach(t => t.stop());

  socket.disconnect();

  window.location.href = "/chat/";
}

if (hangupBtn) {
  hangupBtn.addEventListener("click", endCall);
}

window.addEventListener("beforeunload", endCall);

/* ============ timer======*/

function startTimer() {
  
 if (timerInterval) return;  

  timerInterval = setInterval(() => {

    seconds++;

    const min = String(Math.floor(seconds / 60)).padStart(2,"0");
    const sec = String(seconds % 60).padStart(2,"0");

    document.getElementById("callTimer").innerText = `${min}:${sec}`;

  },1000);


}


/* ================= AUDIO UNLOCK ================= */

document.body.addEventListener("click", () => {

  document.querySelectorAll("audio").forEach(audio => {

    audio.muted = false;

    if (audio.paused) {
      audio.play().catch(()=>{});
    }

  });

}, { once: true });



