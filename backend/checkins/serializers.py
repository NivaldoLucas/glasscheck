from rest_framework import serializers

from drinks.serializers import DrinkSerializer
from establishments.serializers import EstablishmentSerializer

from .models import CheckIn


class CheckInSerializer(serializers.ModelSerializer):
    drink_detail = DrinkSerializer(source="drink", read_only=True)
    establishment_detail = EstablishmentSerializer(source="establishment", read_only=True)
    photo_display_url = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            "id",
            "user",
            "username",
            "drink",
            "drink_detail",
            "establishment",
            "establishment_detail",
            "photo",
            "photo_url",
            "photo_display_url",
            "photo_source",
            "rating",
            "comment",
            "is_cover",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at", "is_cover"]
        extra_kwargs = {"photo": {"write_only": True}}

    def get_photo_display_url(self, obj):
        if obj.photo:
            url = obj.photo.url
            request = self.context.get("request")
            return request.build_absolute_uri(url) if request else url
        return obj.photo_url or None

    def validate(self, attrs):
        photo = attrs.get("photo", getattr(self.instance, "photo", None))
        photo_url = attrs.get("photo_url", getattr(self.instance, "photo_url", ""))
        if not photo and not photo_url:
            raise serializers.ValidationError("Envie uma foto (upload) ou uma photo_url.")
        return attrs
