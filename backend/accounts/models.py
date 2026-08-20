from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Estende o User padrão do Django com dados específicos do GlassCheck."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    bio = models.CharField(max_length=280, blank=True)
    avatar_url = models.URLField(blank=True)
    is_private = models.BooleanField(
        default=False,
        help_text="Se True, apenas amigos aceitos podem ver o catálogo deste usuário.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"
