from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


# =====================================================
# STATUS MODEL
# =====================================================
class Status(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.CharField(max_length=255, blank=True)
    media = models.FileField(upload_to="status/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_video(self):
        """Check if uploaded media is a video"""
        if self.media:
            return self.media.name.lower().endswith(
                (".mp4", ".webm", ".ogg", ".mov")
            )
        return False

    def is_active(self):
        """Return True if status is within last 24 hours"""
        return timezone.now() <= self.created_at + timedelta(hours=24)

    def __str__(self):
        return f"{self.user.username} - Status"

    class Meta:
        ordering = ["-created_at"]


# =====================================================
# STATUS SEEN MODEL
# =====================================================
class StatusSeen(models.Model):
    status = models.ForeignKey(
        Status,
        on_delete=models.CASCADE,
        related_name="seen_by"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("status", "user")
        ordering = ["-seen_at"]

    def __str__(self):
        return f"{self.user.username} saw status {self.status.id}"
