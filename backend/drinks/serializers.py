from rest_framework import serializers

from .models import Drink


class DrinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drink
        fields = ["id", "name", "category", "fallback_photo_url", "created_at"]
        read_only_fields = ["id", "created_at"]
