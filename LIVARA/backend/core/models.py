from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = [
        ("citizen", "Citizen"),
        ("volunteer", "Volunteer"),
        ("ngo", "NGO"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="citizen")
    organisation_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=25, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Report(models.Model):
    CATEGORY_CHOICES = [
        ("food", "Food assistance"),
        ("shelter", "Shelter support"),
        ("human_medical", "Human medical assistance"),
        ("animal_rescue", "Animal rescue"),
        ("road_safety", "Road safety"),
    ]
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]
    STATUS_CHOICES = [
        ("open", "Open"),
        ("accepted", "Accepted"),
        ("in_progress", "In progress"),
        ("resolved", "Resolved"),
        ("rejected", "Rejected"),
    ]

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_reports")
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_reports"
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=160)
    description = models.TextField()
    address = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    photo = models.ImageField(upload_to="reports/", null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
