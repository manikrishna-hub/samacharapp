from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
#from socialMedia import views

urlpatterns = [
    path('admin/', admin.site.urls),
    #path('', include('feed.urls')),
    path("", include(("homepage.urls", "feed"), namespace="feed")),
    path('', include('django.contrib.auth.urls')),
    path('', include('homepage.urls')),
    path('profile/', include('profiles.urls')),
    path('chat/', include('chat.urls')),       # ONLY THIS — keep Chat here
    path("reels/", include("reels.urls")),
    path("status/", include("status.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
