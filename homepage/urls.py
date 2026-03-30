from django.urls import path
from . import views

app_name = 'homepage'

urlpatterns = [

    # Home
    path('', views.home, name='home'),

    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('register/', views.register, name='register'), 
    path('logout/', views.user_logout, name='user_logout'),

    # Posts
    path('create-post/', views.create_post, name='create_post'),
    path('post/<int:post_id>/', views.post_detail, name='post_detail'),
    path('post/<int:post_id>/add_comment/', views.add_comment, name='add_comment'),
    path('edit/<int:post_id>/', views.edit_post, name='edit_post'),
    path('delete/<int:post_id>/', views.delete_post, name='delete_post'),
    path('toggle-like/<int:post_id>/', views.toggle_like, name='toggle_like'),




    # Notifications
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/read/<int:notif_id>/', views.mark_notification_read, name='mark_notification_read'),

    # Search
    path('search/', views.search_users, name='search_users'),
    path("post/<int:post_id>/", views.post_detail, name="post_detail"),

]
