from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Conversation, Message, CallRecord
from django.http import JsonResponse
from django.db import models



# -----------------------------
# SIDEBAR CHAT BUILDER
# -----------------------------
def build_sidebar(request):
    user = request.user
    conversations = Conversation.objects.filter(
        participants=user
    ).order_by("-updated_at")

    sidebar = []

    for conv in conversations:

        # PRIVATE CHAT
        if conv.chat_type == "private":
            other = conv.participants.exclude(id=user.id).first()
            name = other.username if other else "Unknown"
            chat_url = f"/chat/{name}/"
            avatar = other

        # GROUP CHAT
        else:
            name = conv.group_name or "Unnamed Group"
            chat_url = f"/chat/g/{conv.id}/"
            avatar = None

        last = conv.messages.order_by("-timestamp").first()
        unread = conv.messages.filter(seen=False).exclude(sender=user).count()

        sidebar.append({
            "conversation_id": conv.id,
            "name": name,
            "chat_url": chat_url,
            "other_user": avatar,
            "is_group": conv.chat_type == "group",
            "last_message": last.content if last else "",
            "last_time": last.timestamp.strftime("%I:%M %p") if last else "",
            "unread_count": unread,
        })

    return sidebar



# -----------------------------
# CHAT ROOM
# -----------------------------
@login_required
def chat_room(request, username):

    other_user = get_object_or_404(User, username=username)

    # Find or create private conversation
    conversation = (
        Conversation.objects
        .filter(chat_type="private")
        .filter(participants=request.user)
        .filter(participants=other_user)
        .first()
    )

    if not conversation:
        conversation = Conversation.objects.create(chat_type="private")
        conversation.participants.add(request.user, other_user)

    # Load messages
    messages = conversation.messages.order_by("timestamp")

    # 🔥 LOAD ALL USERS for sidebar
    all_users = User.objects.exclude(id=request.user.id)

    chats = []
    for u in all_users:
        chats.append({
            "name": u.username,
            "chat_url": f"/chat/{u.username}/",
            "other_user": u,
            "is_group": False,
            "last_message": "",
            "last_time": "",
            "unread_count": 0,
        })

    return render(request, "chat/chat_room.html", {
        "conversation": conversation,
        "other_user": other_user,
        "messages": messages,
        "chats": chats,
    })

# -----------------------------
# CONTACT LIST (All Users)
# -----------------------------
@login_required
def contacts_list(request):
    all_users = User.objects.exclude(id=request.user.id)
    return render(request, "chat/contacts.html", {"all_users": all_users})

#------Delete----------------

@login_required
def delete_message(request, message_id):
    msg = get_object_or_404(Message, id=message_id)

    # Only sender can delete
    if msg.sender != request.user:
        return JsonResponse({"error": "Not allowed"}, status=403)

    msg.delete()
    return JsonResponse({"success": True})

#---------------side/top bar
@login_required
def chat_list(request):
    users = User.objects.exclude(id=request.user.id)  # Load all users except self
    return render(request, "chat/chat_list.html", {"users": users})

#---------  dirrct open chat page----------------


def direct_chat(request):
    # Get first chat where user is a participant
    chat = Conversation.objects.filter(participants=request.user).first()

    if chat:
        # Get the other participant (for private chat)
        other = chat.participants.exclude(id=request.user.id).first()

        if other:  # important check
            return redirect("chat:chat_room", username=other.username)

    # If no chat → go to chat list
    return redirect("chat:chat_list")
    
    # chat/views.py


def call_room(request, call_id):
    call_type = request.GET.get("type", "audio")
    role = request.GET.get("role", "caller")
    conv = request.GET.get("conv")

    return render(request, "chat/call_room.html", {
        "call_id": call_id,
        "call_type": call_type,
        "role": role,
        "conv_id": conv,
        "user": request.user,
    })

