from django.db.models import Q
from rest_framework import serializers

from accounts.utils import avatar_display_url

from .models import Friendship


class FriendshipSerializer(serializers.ModelSerializer):
    from_username = serializers.CharField(source="from_user.username", read_only=True)
    to_username = serializers.CharField(source="to_user.username", read_only=True)
    from_avatar_url = serializers.SerializerMethodField()
    to_avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = [
            "id",
            "from_user",
            "from_username",
            "from_avatar_url",
            "to_user",
            "to_username",
            "to_avatar_url",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "from_user",
            "from_username",
            "from_avatar_url",
            "to_username",
            "to_avatar_url",
            "status",
            "created_at",
        ]

    def get_from_avatar_url(self, obj):
        return avatar_display_url(getattr(obj.from_user, "profile", None), self.context.get("request"))

    def get_to_avatar_url(self, obj):
        return avatar_display_url(getattr(obj.to_user, "profile", None), self.context.get("request"))

    def validate_to_user(self, to_user):
        request = self.context.get("request")
        viewer = getattr(request, "user", None)
        if not viewer:
            return to_user
        if to_user.id == viewer.id:
            raise serializers.ValidationError("Você não pode adicionar a si mesmo como amigo.")
        already_exists = Friendship.objects.filter(
            Q(from_user=viewer, to_user=to_user) | Q(from_user=to_user, to_user=viewer)
        ).exists()
        if already_exists:
            raise serializers.ValidationError("Já existe uma solicitação de amizade entre vocês.")
        return to_user
