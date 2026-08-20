from django.db import models


class Drink(models.Model):
    """Catálogo global de drinks — compartilhado entre todos os usuários."""

    CATEGORY_CHOICES = [
        ("cocktail", "Coquetel"),
        ("beer", "Cerveja"),
        ("wine", "Vinho"),
        ("spirit", "Destilado"),
        ("other", "Outro"),
    ]

    name = models.CharField(max_length=120, unique=True)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, blank=True
    )
    fallback_photo_url = models.URLField(
        blank=True,
        help_text="Foto padrão usada quando um check-in não tem foto própria.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
