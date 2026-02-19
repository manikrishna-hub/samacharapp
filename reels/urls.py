from django.urls import path
from . import views

urlpatterns = [
    path("", views.reels_feed, name="reels_feed"),
    path("upload/", views.upload_reel, name="upload_reel"),
    path("like/<int:reel_id>/", views.toggle_like, name="toggle_like"),
    path("view/<int:reel_id>/", views.add_view, name="add_view"),
    path("delete/<int:reel_id>/", views.delete_reel, name="delete_reel"),
    
]