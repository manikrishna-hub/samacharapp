console.log("📞 SFU Call Loaded");

const socket = io("http://localhost:3000");

let device;
let sendTransport;
let recvTransport;
let localStream;

const dataEl = document.getElementById("chat-data").dataset;
const roomId = dataEl.convId;
const callType =
  new URLSearchParams(window.location.search).get("type") || "audio";

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const remoteAudio = document.getElementById("remoteAudio");

/* ================= CONNECT TO SFU ================= */

socket.on("connect", async () => {
  console.log("✅ Connected to SFU:", socket.id);

  socket.emit("joinRoom", { roomId }, async (data) => {
    const { rtpCapabilities } = data;

    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });

    console.log("🎯 Device Loaded");

    await createSendTransport();
    await createRecvTransport();
  });
});

/* ================= LOCAL STREAM ================= */

async function getLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === "video",
  });

  if (callType === "video") {
    localVideo.srcObject = localStream;
    localVideo.muted = true;
    await localVideo.play();
  }
}

/* ================= SEND TRANSPORT ================= */

async function createSendTransport() {
  socket.emit("createSendTransport", async (params) => {
    sendTransport = device.createSendTransport(params);

    sendTransport.on("connect", ({ dtlsParameters }, callback) => {
      socket.emit("connectSendTransport", { dtlsParameters }, callback);
    });

    sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
      socket.emit("produce", { kind, rtpParameters }, ({ id }) => {
        callback({ id });
      });
    });

    await getLocalStream();

    for (const track of localStream.getTracks()) {
      await sendTransport.produce({ track });
    }

    console.log("🚀 Producing media to SFU");
  });
}

/* ================= RECEIVE TRANSPORT ================= */

async function createRecvTransport() {
  socket.emit("createRecvTransport", async (params) => {
    recvTransport = device.createRecvTransport(params);

    recvTransport.on("connect", ({ dtlsParameters }, callback) => {
      socket.emit("connectRecvTransport", { dtlsParameters }, callback);
    });
  });
}

/* ================= NEW PRODUCER ================= */

socket.on("newProducer", async ({ producerId }) => {
  socket.emit(
    "consume",
    {
      producerId,
      rtpCapabilities: device.rtpCapabilities,
    },
    async (params) => {
      const consumer = await recvTransport.consume(params);

      const stream = new MediaStream();
      stream.addTrack(consumer.track);

      if (consumer.kind === "video") {
        remoteVideo.srcObject = stream;
        await remoteVideo.play();
      } else {
        remoteAudio.srcObject = stream;
      }

      await consumer.resume();

      console.log("🎥 Consuming stream");
    }
  );
});