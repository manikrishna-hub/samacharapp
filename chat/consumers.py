# chat/consumers.py
import traceback
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import CallRecord
import json


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

            # Set user online
            await self.set_user_online(self.user)

            await self.accept()

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

        except Exception as e:
            print("CONNECT ERROR:", e)
            traceback.print_exc()
            await self.close()

    # ================= DISCONNECT =================
    async def disconnect(self, close_code):
        try:
            if self.user and self.user.is_authenticated:
                await self.set_user_offline(self.user)

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

        except Exception:
            pass

    # ================= PRESENCE HELPERS =================
    @database_sync_to_async
    def set_user_online(self, user):
        user.profile.is_online = True
        user.profile.save(update_fields=["is_online"])

    @database_sync_to_async
    def set_user_offline(self, user):
        user.profile.is_online = False
        user.profile.last_seen = timezone.now()
        user.profile.save(update_fields=["is_online", "last_seen"])

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
            
# -------- CALL + WEBRTC SIGNALING --------
        if msg_type in (
            "call.start",
            "call.accept",
            "call.rejected",
            "call.end",
            "audio_call_offer",
            "audio_call_answer",
            "ice_candidate",
        ):

            content["from"] = self.user.username
            content["from_id"] = self.user.id
            content["conversation_id"] = self.conversation_id

            # Create call record if starting call
            if msg_type == "call.start":
                await self.create_call_record(
                    self.conversation_id,
                    self.user.id,
                    content.get("call_type", "audio"),
                )

                # Send popup to receiver
                receiver_id = content.get("to_id")

                if receiver_id:
                    await self.channel_layer.group_send(
                        f"user_{receiver_id}",
                        {
                            "type": "incoming_call",
                            "caller": self.user.username,
                            "conv_id": self.conversation_id,
                        },
                    )

            # Forward signaling to chat room
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

    async def forward_call(self, event):
        await self.send_json(event["event"])

    # ================= DB HELPERS =================
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
    
# ===========popup incomming menu======
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()


    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )


    async def incoming_call(self, event):

        await self.send(text_data=json.dumps({
            "type": "incoming_call",
            "caller": event["caller"],
            "conv_id": event["conv_id"]
        }))