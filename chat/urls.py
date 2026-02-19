'''from django.urls import path
from .views import ConversationListView, MessageListCreateView
from . import views

urlpatterns = [
    # List user’s conversations
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),

    # List + Create messages in a conversation
    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="message-list-create"),
    path('<str:username>/', views.chat_room, name='chat_room'),
]'''
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    #path('admin/', admin.site.urls),
    path('<str:username>/', views.chat_room, name='chat_room'),
    path('chat/', include('chat.urls')),   # ✅ include chat app
    #path('', include('socialMedia.urls')), # if your feed/home app exists
    # API endpoints
    path('api/conversations/', views.ConversationListView.as_view(), name='conversation_list'),
    path('api/messages/<uuid:conversation_id>/', views.MessageListCreateView.as_view(), name='message_list_create'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
from django.urls import path

from .views import ConversationListView, MessageListCreateView, chat_room

urlpatterns = [
    # List user's conversations
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    
    # Open chat with a username
    path("<str:username>/", chat_room, name="chat_room"),

    # List + create messages
    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="message-list-create"),

    
]
from django.urls import path
from .views import ConversationListView, MessageListCreateView, chat_room

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),

    # Chat route MUST be before conversation_id
    path("<str:username>/", chat_room, name="chat_room"),

    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="message-list-create"),
]"""
"""
from django.urls import path
from .views import (
    ConversationListView,
    MessageListCreateView,
    chat_room,chat_list
)


app_name = "chat"
urlpatterns = [
    # API: List + Create messages
    path("api/chat/<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="message-list-create"),

    # API: list conversations
    path("api/chat/conversations/", ConversationListView.as_view(), name="conversation-list"),

    # Chat page (username → conversation)
    path("<str:username>/", 
         chat_room, 
         name="chat-room"),

    path("contacts/", chat_list, name="contacts"),
     
]

# chat/urls.py
from django.urls import path
from . import views

app_name = "chat"

urlpatterns = [

    
  
    path("api/chat/<int:conversation_id>/messages/", views.MessageListCreateView.as_view(), name="message-list-create"),
    path("api/chat/conversations/", views.ConversationListView.as_view(), name="conversation-list"),
    path("<str:username>/", views.chat_room, name="chat_room"),
    path("api/group/<int:conversation_id>/members/", views.get_group_members),
    path("contacts/", views.contacts, name="contacts"),
    path("contacts/", views.contacts_list, name="contacts_list"),
    path("<str:username>/", views.chat_room, name="chat_room"),
]

"""
"""# chat/urls.py
from django.urls import path
from . import views

app_name = "chat"   

urlpatterns = [
    path("contacts/", views.contacts_list, name="contacts_list"),
    path("<str:username>/", views.chat_room, name="chat_room"),
    path("delete/<int:message_id>/", views.delete_message, name="delete_message"),
    #path('chat/', views.chat_list, name='chat_list'),
    path("list/", views.chat_list, name="chat_list"),
]"""

# chat/urls.py
from django.urls import path
from . import views 

app_name = "chat"

urlpatterns = [
    path("contacts/", views.contacts_list, name="contacts_list"),   # OK
    path("list/", views.chat_list, name="chat_list"),               # CHAT LIST
    path("delete/<int:message_id>/", views.delete_message, name="delete_message"),
    path("go/", views.direct_chat, name="direct_chat"),
    #path("call/<int:call_id>/", views.call_room, name="call_room"),
    path("call/<str:call_id>/", views.call_room, name="call_room"),

    
    path("room/<int:id>/", views.chat_room, name="room"),
    path("", views.direct_chat, name="home"),


    path("<str:username>/", views.chat_room, name="chat_room"),     # ALWAYS LAST
   
    
]

