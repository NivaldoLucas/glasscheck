from rest_framework import serializers

from .models import Friendship


class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ["id", "from_user", "to_user", "status", "created_at"]
        read_only_fields = ["id", "from_user", "status", "created_at"]
