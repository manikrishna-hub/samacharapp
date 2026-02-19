from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Count
from django.views.decorators.http import require_POST
from .models import Post, PostLike, Comment, PostMedia, Notification, Follow
from profiles.models import Profile
from chat.models import Conversation
from django.http import JsonResponse
from django.core.paginator import Paginator


# ================== AUTH ==================

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists!')
            return redirect('register')

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )

        Profile.objects.create(user=user)
        messages.success(request, 'Registration successful! You can now log in.')
        return redirect('login')

    return render(request, 'log/Registration.html')


def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('homepage:home')

        messages.error(request, 'Invalid credentials!')
        return redirect('login')

    return render(request, 'log/login.html')


def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('login')



# ================== HOME / FEED ==================

@login_required(login_url='/login/')
def home(request):

    posts_queryset = (
        Post.objects
        .filter(Q(visibility='public') | Q(user=request.user))
        .select_related('user', 'user__profile')
        .prefetch_related('media')
        .annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True)
        )
        .order_by('-created_at')   # 🔥 ADD THIS
        
    )

    paginator = Paginator(posts_queryset, 10)
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)

    # 🔥 Only check likes for current page posts
    liked_posts = set(
        PostLike.objects.filter(
            user=request.user,
            post__in=posts
        ).values_list('post_id', flat=True)
    )

    following_user_ids = list(
        Follow.objects.filter(
            follower=request.user,
            status='accepted'
        ).values_list('following_id', flat=True)
    )

    return render(request, 'homepage/home.html', {
        'posts': posts,
        'liked_posts': liked_posts,
        'following_user_ids': following_user_ids,
    })

# ================== CREATE POST ==================

@login_required
def create_post(request):
    if request.method == "POST":

        text = request.POST.get("text", "").strip()
        visibility = request.POST.get("visibility", "public")
        bg_color = request.POST.get("bg_color")
        font_style = request.POST.get("font_style")

        media_files = request.FILES.getlist("media")

        # Prevent empty post
        if not text and not media_files:
            messages.error(request, "Post cannot be empty.")
            return redirect("homepage:home")

        # Create post first
        post = Post.objects.create(
            user=request.user,
            text=text,
            visibility=visibility,
            bg_color=bg_color,
            font_style=font_style
        )

        # Save multiple media files
        for file in media_files:
            PostMedia.objects.create(
                post=post,
                file=file
            )

    return redirect("homepage:home")


# ================== LIKE / UNLIKE ==================
@login_required
@require_POST
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    like, created = PostLike.objects.get_or_create(
        post=post,
        user=request.user
    )

    if not created:
        like.delete()
        liked = False
    else:
        liked = True

    return JsonResponse({
        "liked": liked,
        "count": post.likes.count()
    })

#===================== COMMENTS ==================
@login_required
@require_POST
def add_comment(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    text = request.POST.get('text', '').strip()

    if not text:
        return JsonResponse({"error": "Empty comment"}, status=400)

    comment = Comment.objects.create(
        user=request.user,
        post=post,
        text=text
    )

    return JsonResponse({
        "user": comment.user.username,
        "text": comment.text
    })

@login_required
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.select_related('user', 'user__profile')

    return render(request, 'homepage/post_detail.html', {
        'post': post,
        'comments': comments
    })


# ================== EDIT / DELETE POST ==================

@login_required
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)

    if request.method == 'POST':
        post.text = request.POST.get('text', '').strip()
        post.save()
        return redirect('homepage:home')

    return render(request, 'homepage/edit_post.html', {'post': post})


@login_required
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)

    if request.method == 'POST':
        post.delete()
        return redirect('homepage:home')

    return render(request, 'homepage/delete_post.html', {'post': post})


# ================== FOLLOW SYSTEM ==================

@login_required
def send_follow_request(request, user_id):
    to_user = get_object_or_404(User, id=user_id)

    if to_user != request.user:
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=to_user
        )

        if created:
            create_chat_after_follow(request.user, to_user)
            messages.success(request, f"Follow request sent to {to_user.username}.")
        else:
            messages.info(request, "Follow request already sent.")

    return redirect('homepage:home')


@login_required
def unfollow_user(request, user_id):
    to_user = get_object_or_404(User, id=user_id)

    Follow.objects.filter(
        follower=request.user,
        following=to_user
    ).delete()

    messages.info(request, f"You unfollowed {to_user.username}.")
    return redirect('homepage:home')


def create_chat_after_follow(follower, following):
    existing = Conversation.objects.filter(
        chat_type='private',
        participants=follower
    ).filter(
        participants=following
    ).first()

    if not existing:
        conv = Conversation.objects.create(chat_type='private')
        conv.participants.add(follower, following)


# ================== FOLLOW REQUESTS ==================

@login_required
def view_follow_requests(request):
    requests = Follow.objects.filter(
        following=request.user,
        status='pending'
    )

    return render(request, 'homepage/follow_requests.html', {
        'requests': requests
    })


@login_required
def accept_follow_request(request, follow_id):
    follow = get_object_or_404(
        Follow,
        id=follow_id,
        following=request.user
    )

    follow.status = 'accepted'
    follow.save()

    create_chat_after_follow(follow.follower, follow.following)
    messages.success(request, "Follow request accepted.")

    return redirect('view_follow_requests')


@login_required
def reject_follow_request(request, follow_id):
    follow = get_object_or_404(
        Follow,
        id=follow_id,
        following=request.user
    )

    follow.delete()
    messages.info(request, "Follow request rejected.")
    return redirect('view_follow_requests')


# ================== FOLLOWERS LIST ==================

@login_required
def followers_list(request, user_id):
    user = get_object_or_404(User, id=user_id)

    followers = Follow.objects.filter(
        following=user,
        status='accepted'
    )

    following = Follow.objects.filter(
        follower=user,
        status='accepted'
    )

    return render(request, 'homepage/follow_list.html', {
        'profile_user': user,
        'followers': followers,
        'following': following
    })


# ================== NOTIFICATIONS ==================

@login_required
def notifications_view(request):
    notes = request.user.notifications.order_by('-created_at')
    return render(request, 'homepage/notifications.html', {
        'notes': notes
    })


@login_required
def mark_notification_read(request, notif_id):
    note = get_object_or_404(
        Notification,
        id=notif_id,
        to_user=request.user
    )
    note.is_read = True
    note.save()
    return redirect('notifications')


# ================== SEARCH ==================

@login_required
def search_users(request):
    query = request.GET.get('q', '').strip()

    users = (
        User.objects
        .filter(username__icontains=query)
        .exclude(id=request.user.id)
        if query else []
    )

    following_ids = Follow.objects.filter(
        follower=request.user,
        status='accepted'
    ).values_list('following_id', flat=True)

    return render(request, 'log/search.html', {
        'users': users,
        'query': query,
        'following_ids': following_ids
    })
