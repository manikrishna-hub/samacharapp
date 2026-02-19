from django.urls import path
from . import views

urlpatterns = [
    path('edit/', views.edit_profile, name='edit_profile'),
    path("me/", views.profile_view, name="my_profile"),  # ✅ add this
    path("<str:username>/", views.profile_view, name="profile_view"),
    
]