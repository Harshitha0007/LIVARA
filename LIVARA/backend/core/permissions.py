from rest_framework.permissions import BasePermission, SAFE_METHODS

def profile_for(user):
    try:
        return user.profile
    except Exception:
        return None

class CanViewAndCreateReports(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated
                    and profile_for(request.user)
                    and profile_for(request.user).role == "citizen")

class IsResponder(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = profile_for(request.user)
        if not profile:
            return False
        if profile.role == "volunteer":
            return True
        if profile.role == "ngo" and profile.is_verified:
            return True
        return request.user.is_staff
