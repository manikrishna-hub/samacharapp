# chat/consumers.py
import traceback
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .utils import smart_reply_engine
from .models import CallRecord


class ChatConsumer(AsyncJsonWebsocketConsumer):

    # ================= CONNECT =================
    async def connect(self):
        try:
            self.conversation_id = self.scope["url_route"]["kwargs"]["conv_id"]
            self.room_group_name = f"chat_{self.conversation_id}"
            self.user = self.scope.get("user")

            print("WS CONNECTED:", self.conversation_id, self.user)

            if not self.user or not self.user.is_authenticated:
                await self.close()
                return

            ok = await self.user_in_conversation(self.user.id, self.conversation_id)
            if not ok:
                await self.close()
                return

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.channel_layer.group_add(f"user_{self.user.id}", self.channel_name)
            await self.accept()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "presence.update",
                    "user_id": self.user.id,
                    "status": "online",
                },
            )

        except Exception:
            traceback.print_exc()
            await self.close()

    # ================= DISCONNECT =================
    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            await self.channel_layer.group_discard(f"user_{self.user.id}", self.channel_name)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "presence.update",
                    "user_id": self.user.id,
                    "status": "offline",
                    "last_seen": timezone.now().isoformat(),
                },
            )
        except Exception:
            pass

    # ================= RECEIVE =================
    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        # -------- CHAT MESSAGE --------
        if msg_type == "chat.message":
            text = (content.get("message") or "").strip()
            if not text:
                return

            msg = await self.create_message(self.conversation_id, self.user.id, text)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": {
                        "id": msg["id"],
                        "sender": {"id": self.user.id, "username": self.user.username},
                        "content": msg["content"],
                        "timestamp": msg["timestamp"],
                        "delivered": msg["delivered"],
                        "seen": msg["seen"],
                    },
                },
            )
            return

        # -------- TYPING --------
        if msg_type in ("typing", "stop_typing"):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing.status",
                    "user_id": self.user.id,
                    "is_typing": msg_type == "typing",
                },
            )
            return

        # ================= CALL + WEBRTC SIGNALING (FIXED) =================
        if msg_type in (
            "call.start",
            "call.accept",
            "call.rejected",
            "call.end",

    # 🔊 WebRTC audio signaling (FIX)
        "audio_call_offer",
        "audio_call_answer",
        "ice_candidate",
        ):
            content["from"] = self.user.username
            content["from_id"] = self.user.id
            content["conversation_id"] = self.conversation_id

            # Create record ONLY when call starts
            if msg_type == "call.start":
                await self.create_call_record(
                    self.conversation_id,
                    self.user.id,
                    content.get("call_type", "audio"),
                )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "forward.call",
                    "event": content,
                },
            )
            return

    # ================= EVENT HANDLERS =================
    async def chat_message(self, event):
        await self.send_json(event)

    async def typing_status(self, event):
        await self.send_json(event)

    async def presence_update(self, event):
        await self.send_json({"type": "presence", **event})

    async def forward_call(self, data):
        await self.send_json(data["event"])

    # ================= DB HELPERS =================
    @database_sync_to_async
    def user_in_conversation(self, user_id, conv_id):
        from .models import Conversation
        try:
            return Conversation.objects.get(id=conv_id).participants.filter(id=user_id).exists()
        except Exception:
            return False

    @database_sync_to_async
    def create_message(self, conv_id, user_id, text):
        from .models import Conversation, Message
        c = Conversation.objects.get(id=conv_id)
        m = Message.objects.create(conversation=c, sender_id=user_id, content=text)
        return {
            "id": m.id,
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
            "delivered": m.delivered,
            "seen": m.seen,
        }

    @database_sync_to_async
    def create_call_record(self, conv_id, user_id, call_type):
        from .models import Conversation
        c = Conversation.objects.filter(id=conv_id).first()
        return CallRecord.objects.create(
            conversation=c,
            initiator_id=user_id,
            call_type=call_type,
        ).id
 