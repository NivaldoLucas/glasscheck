from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from drinks.models import Drink
from establishments.models import Establishment


class CheckIn(models.Model):
    """
    O registro central do GlassCheck: um drink específico que um usuário tomou,
    opcionalmente em um estabelecimento. Um mesmo drink pode ter vários check-ins
    (ex: mesmo drink em bares diferentes).
    """

    PHOTO_SOURCE_CHOICES = [
        ("user", "Enviada pelo usuário"),
        ("web", "Buscada automaticamente (confirmada pelo usuário)"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="checkins"
    )
    drink = models.ForeignKey(Drink, on_delete=models.PROTECT, related_name="checkins")
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checkins",
    )

    photo = models.ImageField(upload_to="checkins/", blank=True, null=True)
    photo_url = models.URLField(
        blank=True,
        help_text="Usada quando a foto vem de uma busca automática (web) em vez de upload direto.",
    )
    photo_source = models.CharField(max_length=10, choices=PHOTO_SOURCE_CHOICES, default="user")

    rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    comment = models.TextField(max_length=1000, blank=True)

    is_cover = models.BooleanField(
        default=False,
        help_text="Foto escolhida pelo usuário como capa deste drink no catálogo. "
        "Único por (user, drink) — reforçado em CheckInViewSet.set_cover.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        local = self.establishment.name if self.establishment else "sem local"
        return f"{self.user} · {self.drink} · {local}"
