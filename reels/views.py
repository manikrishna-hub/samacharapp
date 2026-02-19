from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .models import Reel, ReelLike, ReelView 

@login_required
def upload_reel(request):
    if request.method == "POST":
        video = request.FILES.get("video")
        caption = request.POST.get("caption", "")
        if video:
            Reel.objects.create(
                user=request.user,
                video=video,
                caption=caption
            )
            return redirect("reels_feed")
    return render(request, "reels/upload.html")

def reels_feed(request):
    reels = Reel.objects.all().order_by("-created_at")
    return render(request, "reels/feed.html", {"reels": reels})

#=======Like Toggle API=============
@login_required
def toggle_like(request, reel_id):
    reel = Reel.objects.get(id=reel_id)

    like, created = ReelLike.objects.get_or_create(
        reel=reel,
        user=request.user
    )

    if not created:
        like.delete()
        reel.likes_count -= 1
        liked = False
    else:
        reel.likes_count += 1
        liked = True

    reel.save(update_fields=["likes_count"])

    return JsonResponse({
        "liked": liked,
        "likes": reel.likes_count
    })
#==========ReelView===========
def add_view(request, reel_id):
    reel = Reel.objects.get(id=reel_id)

    user = request.user if request.user.is_authenticated else None
    ip = request.META.get("REMOTE_ADDR")

    exists = ReelView.objects.filter(
        reel=reel,
        user=user,
        ip_address=ip
    ).exists()

    if not exists:
        ReelView.objects.create(
            reel=reel,
            user=user,
            ip_address=ip
        )
        reel.views_count += 1
        reel.save(update_fields=["views_count"])

    return JsonResponse({"views": reel.views_count})

@login_required
@require_POST
def delete_reel(request, reel_id):
    try:
        reel = Reel.objects.get(id=reel_id, user=request.user)
        reel.delete()
        return JsonResponse({"success": True})
    except Reel.DoesNotExist:
        return JsonResponse({"success": False}, status=404)