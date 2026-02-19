'''from django.urls import path
from .views import ConversationListView, MessageListCreateView

urlpatterns = [
    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="api-messages"),
    path("conversations/", ConversationListView.as_view(), name="api-conversations"),


]

from django.urls import path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/<int:conversation_id>/", ChatConsumer.as_asgi()),
]'''
from django.urls import path
from .views import ConversationListView, MessageListCreateView

urlpatterns = [
    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="api-messages"),
    path("conversations/", ConversationListView.as_view(), name="api-conversations"),
]
    