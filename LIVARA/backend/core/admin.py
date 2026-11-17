from django.contrib import admin
from .models import Profile, Report

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "organisation_name", "phone", "is_verified")
    list_filter = ("role", "is_verified")
    search_fields = ("user__username", "organisation_name", "phone")

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "priority", "status", "created_by", "assigned_to", "created_at")
    list_filter = ("category", "priority", "status", "created_at")
    search_fields = ("title", "description", "address", "created_by__username")
    readonly_fields = ("created_at", "updated_at")
