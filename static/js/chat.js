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

/* ================= STATE ================= */

let socket = null;
let callWindow = null;

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

    // forward call events to call window
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

/* ================= CALL ================= */
function startCall(type) {

  const callId = Date.now();

  const receiverId =
    document.querySelector(".chat-item.active")?.dataset.userId;

  socket.send(JSON.stringify({
    type: "call.start",
    call_id: callId,
    call_type: type,
    to_id: receiverId
  }));

  // play ring tone for caller
  const ring = new Audio("/static/sounds/ring.mp3");
  ring.loop = true;
  ring.play().catch(()=>{});

  callWindow = window.open(
    `/chat/call/${callId}/?type=${type}&conv=${convId}&role=caller`,
    "_blank",
    "width=420,height=720"
  );

  // ================= AUTO MISS CALL =================
  setTimeout(() => {

    if (callWindow && !callWindow.closed) {

      callWindow.close();

      socket.send(JSON.stringify({
        type: "call.missed",
        conv_id: convId
      }));

      ring.pause();
      ring.currentTime = 0;

      alert("Missed Call");

    }

  }, 30000); // 30 seconds
}
/* ================= POPUP → WS BRIDGE ================= */

window.addEventListener("message", (e) => {

  if (!e.data || !e.data.type) return;

  socket.send(JSON.stringify(e.data));

});

/* ================= UI ================= */

function bindUI() {

  sendBtn?.addEventListener("click", sendMessage);

  inputEl?.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }

  });

}