from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save

def profile_image_path(instance, filename):
    return f'profiles/{instance.user.username}/{filename}'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
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

    def __str__(self):
        return self.user.username

    @property
    def profile_pic_url(self):
        if self.profile_pic:
            return self.profile_pic.url
        return '/static/images/default-avatar.png'



@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()
