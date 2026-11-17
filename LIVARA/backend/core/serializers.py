from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, Report

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)
    organisation_name = serializers.CharField(source="profile.organisation_name", read_only=True)
    is_verified = serializers.BooleanField(source="profile.is_verified", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name",
                  "role", "organisation_name", "is_verified"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, default="citizen")
    phone = serializers.CharField(required=False, allow_blank=True)
    organisation_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name",
                  "password", "role", "phone", "organisation_name"]

    def validate(self, attrs):
        if attrs.get("role") == "ngo" and not attrs.get("organisation_name", "").strip():
            raise serializers.ValidationError({"organisation_name": "Organisation name is required for NGO accounts."})
        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role", "citizen")
        phone = validated_data.pop("phone", "")
        organisation_name = validated_data.pop("organisation_name", "")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        profile = user.profile
        profile.role = role
        profile.phone = phone
        profile.organisation_name = organisation_name
        profile.is_verified = False
        profile.save()
        return user

class ReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id", "created_by", "created_by_name", "assigned_to",
            "assigned_to_name", "category", "category_display", "title",
            "description", "address", "latitude", "longitude", "photo",
            "photo_url", "priority", "status", "status_display",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "created_by", "assigned_to", "priority", "status",
            "created_at", "updated_at"
        ]

    def get_photo_url(self, obj):
        request = self.context.get("request")
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None

    def validate(self, attrs):
        lat = attrs.get("latitude")
        lon = attrs.get("longitude")
        if (lat is None) != (lon is None):
            raise serializers.ValidationError("Provide both latitude and longitude, or neither.")
        if lat is not None and not (-90 <= float(lat) <= 90):
            raise serializers.ValidationError({"latitude": "Latitude must be between -90 and 90."})
        if lon is not None and not (-180 <= float(lon) <= 180):
            raise serializers.ValidationError({"longitude": "Longitude must be between -180 and 180."})
        return attrs
