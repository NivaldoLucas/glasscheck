from rest_framework import serializers

from drinks.serializers import DrinkSerializer
from establishments.serializers import EstablishmentSerializer

from .models import CheckIn


class CheckInSerializer(serializers.ModelSerializer):
    drink_detail = DrinkSerializer(source="drink", read_only=True)
    establishment_detail = EstablishmentSerializer(source="establishment", read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            "id",
            "user",
            "drink",
            "drink_detail",
            "establishment",
            "establishment_detail",
            "photo_url",
            "photo_source",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]
