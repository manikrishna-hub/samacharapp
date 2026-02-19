from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Max
from django.utils import timezone
from datetime import timedelta

from .models import Status, StatusSeen


# =====================================================
# STATUS LIST PAGE
# Shows latest active (24h) status per user
# =====================================================
@login_required
def status_page(request):
    last_24_hours = timezone.now() - timedelta(hours=24)

    latest_status_ids = (
        Status.objects
        .filter(created_at__gte=last_24_hours)
        .values("user")
        .annotate(latest_id=Max("id"))
        .values_list("latest_id", flat=True)
    )

    statuses = (
        Status.objects
        .filter(id__in=latest_status_ids)
        .select_related("user")
        .order_by("-created_at")
    )

    return render(request, "status/status.html", {
        "statuses": statuses
    })


# =====================================================
# UPLOAD STATUS (Image / Video)
# =====================================================
@login_required
def upload_status(request):
    if request.method == "POST":
        text = request.POST.get("text", "").strip()
        media = request.FILES.get("media")

        if media:
            Status.objects.create(
                user=request.user,
                text=text,
                media=media
            )

        return redirect("status:status_page")

    return render(request, "status/upload_status.html")


# =====================================================
# STATUS VIEWER
# Shows all active (24h) statuses of a user
# =====================================================
@login_required
def status_viewer(request, user_id):
    last_24_hours = timezone.now() - timedelta(hours=24)

    statuses = (
        Status.objects
        .filter(user_id=user_id, created_at__gte=last_24_hours)
        .select_related("user")
        .order_by("created_at")
    )

    if not statuses.exists():
        return redirect("status:status_page")

    return render(request, "status/status_viewer.html", {
        "statuses": statuses
    })


# =====================================================
# SINGLE STATUS VIEW
# 24h protection + SEEN tracking
# =====================================================
@login_required
def status_view(request, status_id):
    last_24_hours = timezone.now() - timedelta(hours=24)

    status = get_object_or_404(
        Status,
        id=status_id,
        created_at__gte=last_24_hours
    )

    # ✅ Mark status as SEEN (except owner)
    if request.user != status.user:
        StatusSeen.objects.get_or_create(
            status=status,
            user=request.user
        )

    return render(request, "status/status_view.html", {
        "status": status
    })
# =====================================================
# STATUS SEEN LIST
# Shows who viewed my status (owner only)
# =====================================================
@login_required
def status_seen_list(request, status_id):
    status = get_object_or_404(
        Status,
        id=status_id,
        user=request.user   # 🔒 only owner can see
    )

    seen_users = (
        StatusSeen.objects
        .filter(status=status)
        .select_related("user")
        .order_by("-seen_at")
    )

    return render(request, "status/status_seen_list.html", {
        "status": status,
        "seen_users": seen_users
    })
@login_required
def status_view(request, status_id):
    last_24_hours = timezone.now() - timedelta(hours=24)

    status = get_object_or_404(
        Status,
        id=status_id,
        created_at__gte=last_24_hours
    )

    if request.user != status.user:
        StatusSeen.objects.get_or_create(
            status=status,
            user=request.user
        )

    return render(request, "status/status_view.html", {
        "status": status
    })
