from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.models import User
from homepage.models import Post
from .models import Follow
from django.contrib import messages
from datetime import date
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse  # add at top
import re



# =============================
# My Profile
# =============================
@login_required
def my_profile(request):
    posts = Post.objects.filter(user=request.user).order_by("-created_at")

    return render(request, "accounts/profile.html", {
        "profile_user": request.user,
        "posts": posts,
    })


# =============================
# Public Profile
# =============================
def public_profile(request, username):
    user = get_object_or_404(User, username=username)
    posts = Post.objects.filter(user=user).order_by("-created_at")

    follow = None
    is_following = False
    is_pending = False

    if request.user.is_authenticated:
        follow = Follow.objects.filter(
            follower=request.user,
            following=user
        ).first()

        if follow:
            if follow.is_accepted:
                is_following = True
            else:
                is_pending = True

    followers_count = user.followers.count()
    following_count = user.following.count()

    return render(request, "accounts/profile.html", {
        "profile_user": user,
        "posts": posts,
        "is_following": is_following,
        "is_pending": is_pending,
        "followers_count": followers_count,
        "following_count": following_count,
    })

# =============================
# Follow / Unfollow
# =============================
@login_required
def toggle_follow(request, username):
    target_user = get_object_or_404(User, username=username)

    if request.user == target_user:
        return redirect("accounts:public_profile", username=username)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=target_user
    )

    if not created:
        # Unfollow
        follow.delete()
    else:
        # If private account → request pending
        if target_user.profile.is_private:
            follow.is_accepted = False
        else:
            follow.is_accepted = True
        follow.save()

    return redirect("accounts:public_profile", username=username)

# =============================
# Followers List
# =============================
def followers_list(request, username):
    user = get_object_or_404(User, username=username)
    followers = user.followers.select_related("follower")

    return render(request, "accounts/followers_list.html", {
        "profile_user": user,
        "followers": followers
    })


# =============================
# Following List
# =============================
def following_list(request, username):
    user = get_object_or_404(User, username=username)
    following = user.following.select_related("following")

    return render(request, "accounts/following_list.html", {
        "profile_user": user,
        "following": following
    })

# ===============================
# 🔔 FOLLOW REQUESTS PAGE
# ===============================

@login_required
def follow_requests(request):
    requests = Follow.objects.filter(
        following=request.user,
        is_accepted=False
    ).select_related("follower")

    return render(request, "accounts/follow_requests.html", {
        "requests": requests
    })

# ===============================
#    Accept / Reject Views
# ===============================
@login_required
def accept_request(request, follow_id):
    follow = get_object_or_404(Follow, id=follow_id, following=request.user)
    follow.is_accepted = True
    follow.save()
    return redirect("accounts:follow_requests")


@login_required
def reject_request(request, follow_id):
    follow = get_object_or_404(Follow, id=follow_id, following=request.user)
    follow.delete()
    return redirect("accounts:follow_requests")



#========== Register====================
from .models import Profile  # make sure this exists

def register_view(request):
    if request.method == "POST":
        contact = request.POST.get("contact")
        username = request.POST.get("username")
        password = request.POST.get("password")
        full_name = request.POST.get("full_name")
        dob = request.POST.get("date_of_birth")

        email = None

        # Contact Validation
        if not contact:
            messages.error(request, "Contact is required")
            return render(request, "accounts/register.html")

        if "@" in contact:
            if not re.match(r"[^@]+@[^@]+\.[^@]+", contact):
                messages.error(request, "Enter valid email")
                return render(request, "accounts/register.html")
            email = contact.lower()

        # Username Validation
        if not username:
            messages.error(request, "Username is required")
            return render(request, "accounts/register.html")

        if len(username) < 3:
            messages.error(request, "Username must be at least 3 characters")
            return render(request, "accounts/register.html")

        if not re.match(r'^[a-zA-Z0-9]+$', username):
            messages.error(request, "Username must contain only letters and numbers")
            return render(request, "accounts/register.html")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return render(request, "accounts/register.html")

        # Password Validation
        if not password:
            messages.error(request, "Password is required")
            return render(request, "accounts/register.html")

        if len(password) < 6:
            messages.error(request, "Password must be at least 6 characters")
            return render(request, "accounts/register.html")

        # DOB Validation
        dob = profile.date_of_birth
        today = date.today()

        age = today.year - dob.year
        if (today.month, today.day) < (dob.month, dob.day):
            age -= 1
        print("DOB:", dob)
        print("AGE:", age)

        if age < 16:
            messages.error(request, "You must be 16+ to login")
            return redirect("accounts:login")

        # =========================
        # 🔥 OTP LOGIC (INSIDE POST)
        # =========================
        user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=full_name
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.date_of_birth = dob

        if "@" not in contact:
            profile.phone = contact

        profile.save()

        messages.success(request, "Account created successfully!")

        return redirect("accounts:login")
        

    return render(request, "accounts/register.html")
#==========================================================
#   login OTP
#=========================================
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:

            # 🔥 AGE CHECK
            profile = user.profile  # make sure Profile is linked

            dob = profile.date_of_birth
            today = date.today()

            age = today.year - dob.year 
            if (today.month, today.day) < (dob.month, dob.day):
                age -= 1

            if age < 16:
                messages.error(request, "You must be 16+ to login")
                return redirect("accounts:login")

            # ✅ LOGIN AFTER CHECK
            login(request, user)
            return redirect("accounts:my_profile")

        else:
            messages.error(request, "Invalid username or password")
            return redirect("accounts:login")

    return render(request, "accounts/login.html")


def check_username(request):
    username = request.GET.get("username")

    if not username:
        return JsonResponse({"available": False})

    exists = User.objects.filter(username=username).exists()

    return JsonResponse({
        "available": not exists
    })


def logout_view(request):
    logout(request)
    return redirect("accounts:login")