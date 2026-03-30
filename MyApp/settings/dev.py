from .base import *

DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS += [
    'channels',
    
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'Myappdata'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': 'Mani2405@',  # ✅ fixed
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# =========================
# EMAIL (DEV MODE)
# =========================
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = "test@example.com"
EMAIL_HOST_USER = "test@example.com"