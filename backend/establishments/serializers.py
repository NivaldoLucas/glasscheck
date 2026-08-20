from rest_framework import serializers

from .models import Establishment


class EstablishmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Establishment
        fields = ["id", "name", "address", "fallback_photo_url", "created_at"]
        read_only_fields = ["id", "created_at"]
