from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.utils import timezone
from django.templatetags.static import static


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    bio = models.TextField(blank=True, null=True)

    profile_pic = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
    )

    cover_picture = models.ImageField(
        upload_to='cover_pics/',
        blank=True,
        null=True
    )

    is_private = models.BooleanField(default=False)

    # ✅ DOB (for 16+ validation)
    date_of_birth = models.DateField(null=True, blank=True)

    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.user.username

    @property
    def profile_pic_url(self):
        if self.profile_pic:
            return self.profile_pic.url
        return static('images/default-avatar.png')


# ✅ SAFE SIGNAL
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    Profile.objects.get_or_create(user=instance)


class Follow(models.Model):
    follower = models.ForeignKey(
        User,
        related_name="following",
        on_delete=models.CASCADE
    )
    following = models.ForeignKey(
        User,
        related_name="followers",
        on_delete=models.CASCADE
    )

    is_accepted = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"