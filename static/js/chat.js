// static/js/chat.js
console.log("💬 chat.js loaded");

/* ================= DOM + DATA ================= */
const dataEl = document.getElementById("chat-data");
if (!dataEl) throw new Error("chat-data missing");

const convId = dataEl.dataset.convId;
const userId = Number(dataEl.dataset.userId);

/* ================= ELEMENTS ================= */
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const userStatusEl = document.getElementById("userStatus");

/* ===== Incoming call popup ===== */
const callPopup = document.getElementById("incomingCallPopup");
const acceptBtn = document.getElementById("acceptCallBtn");
const rejectBtn = document.getElementById("rejectCallBtn");
const callerNameEl = document.getElementById("incomingCallerName");
const callTypeEl = document.getElementById("incomingCallType");

const ringtone = document.getElementById("ringtone");
const ringback = document.getElementById("ringbackTone");

/* ================= STATE ================= */
let socket = null;
let incomingCall = null;
let typingTimer = null;
let callPopupActive = false;
let callWindow = null;   // 🔥 IMPORTANT

/* ================= WEBSOCKET ================= */
const WS_URL =
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/chat/${convId}/`;

connectSocket();
bindUI();

/* ================= SOCKET ================= */
function connectSocket() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("✅ Chat WS connected");
    userStatusEl.textContent = "Online";
  };

  socket.onclose = () => {
    console.log("❌ Chat WS disconnected");
    userStatusEl.textContent = "Offline";
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);

    // 🔥 FORWARD ALL CALL EVENTS TO POPUP
    if (callWindow && !callWindow.closed) {
      callWindow.postMessage(data, "*");
    }

    handleWSMessage(data);
  };
}

/* ================= HANDLE EVENTS ================= */
function handleWSMessage(data) {
  const t = data.type;

  if (t === "chat.message") {
    appendMessage(data.message);
    return;
  }

  if (t === "typing") {
    userStatusEl.textContent = "typing…";
    return;
  }

  if (t === "stop_typing") {
    userStatusEl.textContent = "Online";
    return;
  }

  /* ===== Incoming call ===== */
  if (t === "call.start") {
    if (callPopupActive) return;

    callPopupActive = true;

    incomingCall = {
      callId: data.call_id,
      type: data.call_type
    };

    callerNameEl.textContent = data.from || "Incoming call";
    callTypeEl.textContent =
      incomingCall.type === "audio" ? "Audio Call" : "Video Call";

    callPopup.classList.remove("hidden");
    ringtone?.play().catch(() => {});
    return;
  }

  if (t === "call.end" || t === "call.rejected") {
    stopRingtones();
    closePopup();
  }
}

/* ================= CHAT ================= */
function appendMessage(msg) {
  if (!msg?.content) return;

  const mine = msg.sender.id === userId;
  const row = document.createElement("div");
  row.className = `message-row ${mine ? "row-me" : "row-other"}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${mine ? "me" : "other"}`;
  bubble.textContent = msg.content;

  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  socket.send(JSON.stringify({
    type: "chat.message",
    message: text
  }));

  inputEl.value = "";
}

/* ================= CALL AC	TIONS ================= */
function startCall(type) {
  const callId = Date.now();

  ringback?.play().catch(() => {});

  socket.send(JSON.stringify({
    type: "call.start",
    call_id: callId,
    call_type: type
  }));

  // ✅ use type, NOT incomingCall
  callWindow = window.open(
    `/chat/call/${callId}/?type=${type}&role=caller&conv=${convId}`,
    "_blank",
    "width=380,height=620"
  );
}
function acceptCall() {
  if (!incomingCall) return;

  // 🔥 open window FIRST
  callWindow = window.open(
    `/chat/call/${incomingCall.callId}/?type=${incomingCall.type}&role=receiver&conv=${convId}`,
    "_blank",
    "width=380,height=620"
  );

  // 🔥 then notify caller
  socket.send(JSON.stringify({
    type: "call.accept",
    call_id: incomingCall.callId
  }));

  stopRingtones();
  closePopup();
}
function rejectCall() {
  if (!incomingCall) return;

  socket.send(JSON.stringify({
    type: "call.rejected",
    call_id: incomingCall.callId
  }));

  stopRingtones();
  closePopup();
}

/* ================= POPUP → WS BRIDGE 🔥 ================= */
window.addEventListener("message", (e) => {
  if (!e.data || !e.data.type) return;
  socket.send(JSON.stringify(e.data));
});

/* ================= HELPERS ================= */
function stopRingtones() {
  ringtone?.pause();
  ringback?.pause();
  if (ringtone) ringtone.currentTime = 0;
  if (ringback) ringback.currentTime = 0;
}

function closePopup() {
  callPopup.classList.add("hidden");
  incomingCall = null;
  callPopupActive = false;
}

/* ================= UI ================= */
function bindUI() {
  sendBtn?.addEventListener("click", sendMessage);

  inputEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    } else {
      sendTyping();	
    }
  });
	
  acceptBtn?.addEventListener("click", acceptCall);
  rejectBtn?.addEventListener("click", rejectCall);
}

function sendTyping() {
  socket.send(JSON.stringify({ type: "typing" }));
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.send(JSON.stringify({ type: "stop_typing" }));
  }, 1200);
}
