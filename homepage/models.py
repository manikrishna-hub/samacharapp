from django.db import models
from django.contrib.auth.models import User

# ================== POST ==================
class Post(models.Model):

    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts',
        db_index=True
    )

    text = models.TextField(blank=True)
    bg_color = models.CharField(max_length=20, blank=True, null=True)
    font_style = models.CharField(max_length=20, default="normal")

    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default='public',
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['visibility', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"


# ================== POST MEDIA ==================
class PostMedia(models.Model):

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='media',
        db_index=True
    )

    file = models.FileField(upload_to='posts/media/')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_video(self):
        return self.file.name.lower().endswith(
            ('.mp4', '.mov', '.avi', '.mkv', '.webm')
        )

    def __str__(self):
        return f"Media for {self.post.id}"


# ================== LIKE ==================
class PostLike(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes',
        db_index=True
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')


# ================== COMMENT ==================
class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        db_index=True
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_index=True
    )

    text = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        ordering = ['-created_at']


# ================== FOLLOW ==================
class Follow(models.Model):
    follower = models.ForeignKey(
        User,
        related_name='following',
        on_delete=models.CASCADE,
        db_index=True
    )

    following = models.ForeignKey(
        User,
        related_name='followers',
        on_delete=models.CASCADE,
        db_index=True
    )

    status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted')],
        default='pending',
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['follower', 'following'],
                name='unique_follow_relationship'
            )
        ]
        indexes = [
            models.Index(fields=['follower']),
            models.Index(fields=['following']),
        ]


# ================== NOTIFICATION ==================
class Notification(models.Model):
    to_user = models.ForeignKey(
        User,
        related_name='notifications',
        on_delete=models.CASCADE,
        db_index=True
    )

    from_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True
    )

    verb = models.CharField(max_length=100)

    target_post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True
    )

    is_read = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['to_user', 'is_read']),
            models.Index(fields=['to_user', '-created_at']),
        ]
