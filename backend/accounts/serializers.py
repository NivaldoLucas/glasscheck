from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import serializers

from social.models import Friendship

from .models import Profile
from .utils import avatar_display_url


class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    friendship_status = serializers.SerializerMethodField()
    friendship_id = serializers.SerializerMethodField()
    avatar_display_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "username",
            "bio",
            "avatar",
            "avatar_url",
            "avatar_display_url",
            "is_private",
            "created_at",
            "friendship_status",
            "friendship_id",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "created_at",
            "friendship_status",
            "friendship_id",
            "avatar_display_url",
        ]
        extra_kwargs = {"avatar": {"write_only": True}}

    def get_avatar_display_url(self, obj):
        return avatar_display_url(obj, self.context.get("request"))

    def _friendship(self, obj):
        request = self.context.get("request")
        viewer = getattr(request, "user", None)
        if not viewer or not viewer.is_authenticated or viewer.id == obj.user_id:
            return None
        return Friendship.objects.filter(
            Q(from_user=viewer, to_user_id=obj.user_id) | Q(from_user_id=obj.user_id, to_user=viewer)
        ).first()

    def get_friendship_status(self, obj):
        request = self.context.get("request")
        viewer = getattr(request, "user", None)
        if not viewer or not viewer.is_authenticated:
            return None
        if viewer.id == obj.user_id:
            return "self"
        friendship = self._friendship(obj)
        if not friendship:
            return "none"
        if friendship.status == "accepted":
            return "accepted"
        return "pending_sent" if friendship.from_user_id == viewer.id else "pending_received"

    def get_friendship_id(self, obj):
        friendship = self._friendship(obj)
        return friendship.id if friendship else None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user)
        return user
