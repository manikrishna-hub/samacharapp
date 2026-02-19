from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect,  get_object_or_404
from django.contrib.auth.models import User
from .models import Profile
from homepage.models import Follow, Post # ✅ import this at top
from reels.models import Reel

@login_required(login_url='login')
def edit_profile(request):
    # Get or create the user's profile (if it doesn't exist yet)
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        # Update bio
        profile.bio = request.POST.get("bio", "").strip()

          # ✅ Save new profile picture if uploaded
        if "profile_pic" in request.FILES:
            profile.profile_pic = request.FILES["profile_pic"]
        # # ✅ Save new cover picture if uploaded
        if "cover_picture" in request.FILES:
            profile.cover_picture = request.FILES["cover_picture"]

        profile.save()
        return redirect("my_profile")  # Redirect to feed or profile page

    # Render the edit page
    return render(request, "profiles/edit_profile.html", {"profile": profile})

@login_required
def profile_view(request, username=None):

    if username:
        user = get_object_or_404(User, username=username)
    else:
        user = request.user

    profile, created = Profile.objects.get_or_create(user=user)

    # 🔥 Follow Stats
    followers_count = Follow.objects.filter(following=user).count()
    following_count = Follow.objects.filter(follower=user).count()

    is_following = Follow.objects.filter(
        follower=request.user,
        following=user
    ).exists()

    # 🔥 Posts Query
    posts = (
        Post.objects
        .filter(user=user)
        .select_related("user", "user__profile")
        .prefetch_related("media")
        .order_by("-created_at")
    )

    # 🔥 Reels Query
    reels = (
        Reel.objects
        .filter(user=user)
        .order_by("-created_at")
    )

    # 🔥 ADD THESE COUNT LINES HERE 👇
    posts_count = posts.count()
    reels_count = reels.count()

    context = {
        "user_obj": user,
        "profile": profile,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts": posts,
        "reels": reels,
        "posts_count": posts_count,      # 👈 added
        "reels_count": reels_count,      # 👈 added
        "is_following": is_following,
    }

    return render(request, "profiles/profile_view.html", context)
