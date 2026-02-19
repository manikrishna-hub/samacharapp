from django.urls import path
from . import views

app_name = "status"

urlpatterns = [
    path("", views.status_page, name="status_page"),
    path("upload/", views.upload_status, name="upload_status"),
    path("viewer/<int:user_id>/", views.status_viewer, name="status_viewer"),
    path("view/<int:status_id>/", views.status_view, name="status_view"),

    path("seen/<int:status_id>/", views.status_seen_list, name="status_seen_list"),
]
