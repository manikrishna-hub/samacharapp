console.log("📞 Audio Call Loaded");
if (!window.opener) {
  alert("Call window lost connection to chat. Please retry the call.");
}


/* ================= DATA ================= */
const dataEl = document.getElementById("chat-data").dataset;
const callId = dataEl.callId;
const role = dataEl.role;

/* ================= UI ================= */
const incoming = document.getElementById("incomingControls");
const active = document.getElementById("activeControls");
const acceptBtn = document.getElementById("acceptBtn");	
const rejectBtn = document.getElementById("rejectBtn");
const hangupBtn = document.getElementById("hangupBtn");

/* ================= AUDIO ================= */
const remoteAudio = document.getElementById("remoteAudio");
const ringtone = document.getElementById("ringtone");
const ringback = document.getElementById("ringbackTone");
remoteAudio.autoplay = true;
remoteAudio.muted = false;

/*=================video==================*/
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const callType =
  new URLSearchParams(window.location.search).get("type") || "audio";

if (callType === "audio") {
  localVideo.hidden = true;
  remoteVideo.hidden = true;
}
	
/* ================= TIMER ================= */
let callStartTime = null;
let callTimerInterval = null;
const callTimerEl = document.getElementById("callTimer");

/* ================= WEBRTC ================= */
let pc = null;
let localStream = null;
let pendingICE = [];
let callActive = false;

/* ================= INIT UI ================= */
if (role === "caller") {
  // 🔵 SENDER
  incoming.hidden = true;   // ❌ no Accept / Reject
  active.hidden = false;    // ✅ End Call
  ringback?.play().catch(() => {});
}

if (role === "receiver") {
  // 🟢 RECEIVER
  incoming.hidden = false;  // ✅ Accept / Reject
  active.hidden = true;     // ❌ no End Call yet
  ringtone?.play().catch(() => {});
}


/* ================= RECEIVE EVENTS FROM chat.js ================= */
/*
  chat.js MUST send messages like:
  window.open(...).postMessage(event, "*")
*/
window.addEventListener("message", async (event) => {
  const data = event.data;
  if (!data || data.call_id !== callId) return;

  console.log("📡 CALL EVENT:", data.type);

  if (data.type === "call.accept" && role === "caller") {
    callActive = true;
    ringback.pause();
    ringback.currentTime = 0;
    startCallTimer();
    await startCallerOffer();
  }

  if (data.type === "audio_call_offer" && role === "receiver") {
    await setupPeer();
    startCallTimer();

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    flushICE();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    window.opener?.postMessage({
      type: "audio_call_answer",
      answer,
      call_id: callId
    }, "*");

    ringtone.pause();
    ringtone.currentTime = 0;
    
    incoming.hidden = true;
    active.hidden = fasle;
  }

  if (data.type === "audio_call_answer" && role === "caller") {
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    flushICE();
  }

  if (data.type === "ice_candidate") {
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      pendingICE.push(data.candidate);
    }
  }

  if (data.type === "call.end" || data.type === "call.rejected") {
    endCall();
  }
});

/* ================= WEBRTC ================= */
async function setupPeer() {
  if (pc) return;

  pc = new RTCPeerConnection({
    iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80?transport=udp",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:80?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]

  });

  pc.onicecandidate = (e) => {
    if (e.candidate) {
       console.log("🧊 ICE:", e.candidate.type, e.candidate.protocol);
      
        window.opener?.postMessage({
        type: "ice_candidate",
        candidate: e.candidate.toJSON(), 
        call_id: callId
      }, "*");
    }
  };
   
 pc.oniceconnectionstatechange = () => {
  console.log("❄ ICE state:", pc.iceConnectionState);
};

pc.onconnectionstatechange = () => {
  console.log("📡 Peer state:", pc.connectionState);
};

pc.ontrack = (e) => {
  const stream = e.streams[0];

  if (e.track.kind === "video") {
    remoteVideo.srcObject = stream;
    remoteVideo.play().catch(() => {});
  }
	
  if (e.track.kind === "audio") {
    remoteAudio.srcObject = stream;
    remoteAudio.play().catch(() => {});
  }
};

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true,  video:callType === "video" });
  /* 👇 ADD THIS LINE HERE */
      
    localVideo.srcObject = localStream;
  /* send tracks to peer */   
   localVideo.muted = true;
   localVideo.play().catch(() => {});	
  
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
}

function flushICE() {
  pendingICE.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
  pendingICE = [];
}

async function startCallerOffer() {
  await setupPeer();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  window.opener?.postMessage({
    type: "audio_call_offer",
    offer,
    call_id: callId
  }, "*");
}

/* ================= BUTTONS ================= */
acceptBtn.onclick = () => {
  // 🔔 Tell chat.js that receiver accepted the call
  window.opener?.postMessage({
    type: "call.accept",
    call_id: callId
  }, "*");

  // 🔄 Update UI
  incoming.hidden = true;
  active.hidden = false;
};

rejectBtn.onclick = () => {
  window.opener?.postMessage({
    type: "call.rejected",
    call_id: callId
  }, "*");
  endCall();
};

hangupBtn.onclick = () => {
  window.opener?.postMessage({
    type: "call.end",
    call_id: callId
  }, "*");
  endCall();
};

/* ================= TIMER ================= */
function startCallTimer() {
  callStartTime = Date.now();	
  callTimerInterval = setInterval(() => {
    const diff = Date.now() - callStartTime;
    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / 60000);
    callTimerEl.textContent =
      `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, 1000);
}

function stopCallTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
}

/* ================= CLEANUP ================= */
function endCall() {
  stopCallTimer();
  try {
    localStream?.getTracks().forEach(t => t.stop());
    pc?.close();
  } catch (e) {}
  window.close();
}
