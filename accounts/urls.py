'''from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    # 🔐 Auth
    
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # 👤 Profile
    path("profile/", views.my_profile, name="my_profile"),
    path("@<str:username>/", views.public_profile, name="public_profile"),

    # 🔁 Follow system
    path("follow/<str:username>/", views.toggle_follow, name="toggle_follow"),
    path("@<str:username>/followers/", views.followers_list, name="followers_list"),
    path("@<str:username>/following/", views.following_list, name="following_list"),

    # 🔔 Follow Requests
    path("follow-requests/", views.follow_requests, name="follow_requests"),
    path("accept/<int:follow_id>/", views.accept_request, name="accept_request"),
    path("reject/<int:follow_id>/", views.reject_request, name="reject_request"),
    path("check-username/", views.check_username, name="check_username"), 
   

]'''

from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    # 🔐 Auth
    path("register/", views.register_view, name="register"),  # ✅ ADD THIS
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # 👤 Profile
    path("profile/", views.my_profile, name="my_profile"),
    path("@<str:username>/", views.public_profile, name="public_profile"),

    # 🔁 Follow system
    path("follow/<str:username>/", views.toggle_follow, name="toggle_follow"),
    path("@<str:username>/followers/", views.followers_list, name="followers_list"),
    path("@<str:username>/following/", views.following_list, name="following_list"),

    # 🔔 Follow Requests
    path("follow-requests/", views.follow_requests, name="follow_requests"),
    path("accept/<int:follow_id>/", views.accept_request, name="accept_request"),
    path("reject/<int:follow_id>/", views.reject_request, name="reject_request"),

    path("check-username/", views.check_username, name="check_username"),
]
