from django.contrib import admin
from .models import Status


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "is_active")
    list_filter = ("created_at",)
    search_fields = ("user__username", "text")

