from django.db import models


class Establishment(models.Model):
    """Catálogo global de estabelecimentos (bares, restaurantes etc.)."""

    name = models.CharField(max_length=150, unique=True)
    address = models.CharField(max_length=255, blank=True)
    fallback_photo_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
