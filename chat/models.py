from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    CHAT_TYPE_CHOICES = (
        ('private', 'Private Chat'),
        ('group', 'Group Chat'),
    )

    chat_type = models.CharField(max_length=10, choices=CHAT_TYPE_CHOICES, default='private')

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )

    admins = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='admin_conversations',
        blank=True
    )

    group_name = models.CharField(max_length=255, blank=True, null=True)
    group_icon = models.ImageField(upload_to='group_icons/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.chat_type == "group":
            return f"Group: {self.group_name or 'Unnamed Group'}"
        return f"Private Conversation {self.id}"

    # Helpers
    def is_group(self):
        return self.chat_type == "group" or self.participants.count() > 2

    def is_private(self):
        return self.chat_type == "private" and self.participants.count() == 2

    def add_admin(self, user):
        if not self.participants.filter(id=user.id).exists():
            self.participants.add(user)
        self.admins.add(user)
        self.save()

    def remove_admin(self, user):
        self.admins.remove(user)
        self.save()

    def is_admin(self, user):
        return self.admins.filter(id=user.id).exists()

    def add_participant(self, user):
        self.participants.add(user)
        self.save()

    def remove_participant(self, user):
        self.admins.remove(user)
        self.participants.remove(user)
        self.save()


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()

    timestamp = models.DateTimeField(auto_now_add=True)
    delivered = models.BooleanField(default=False)
    seen = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender} @ {self.timestamp}: {self.content[:30]}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.conversation.updated_at = timezone.now()
        self.conversation.save(update_fields=['updated_at'])


class CallRecord(models.Model):
    CALL_TYPE_CHOICES = (
        ("audio", "Audio"),
        ("video", "Video")
    )

    CALL_STATUS_CHOICES = (
        ("missed", "Missed"),
        ("completed", "Completed"),
        ("rejected", "Rejected")
    )

    conversation = models.ForeignKey("Conversation", null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name="calls")

    initiator = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="initiated_calls",
                                  on_delete=models.SET_NULL, null=True)

    participants = models.ManyToManyField(settings.AUTH_USER_MODEL,
                                          related_name="call_participations", blank=True)

    call_type = models.CharField(max_length=10, choices=CALL_TYPE_CHOICES)
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)

    duration_seconds = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=CALL_STATUS_CHOICES, default="missed")

    metadata = models.JSONField(default=dict, blank=True)

    def finish(self):
        if not self.ended_at:
            self.ended_at = timezone.now()
            self.duration_seconds = int((self.ended_at - self.started_at).total_seconds())
            self.status = "completed"
            self.save()
