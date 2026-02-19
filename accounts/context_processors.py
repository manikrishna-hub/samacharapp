def user_profile(request):
    if request.user.is_authenticated:
        return {
            "user_profile": getattr(request.user, "profile", None)
        }
    return {}
