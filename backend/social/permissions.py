"""
Regras de visibilidade de perfil privado (ver decisão 5 do documento de
conceito): um perfil privado só é visível para o próprio dono e para amigos
com Friendship aceita. Usado tanto por ProfileViewSet (accounts) quanto por
CheckInViewSet (checkins) para esconder o catálogo de usuários privados.
"""

from django.db.models import Q

from accounts.models import Profile

from .models import Friendship


def accepted_friend_ids(user):
    """IDs de usuários com amizade aceita com `user`, em qualquer direção."""
    pairs = Friendship.objects.filter(status="accepted").filter(
        Q(from_user=user) | Q(to_user=user)
    ).values_list("from_user_id", "to_user_id")
    return {other for a, b in pairs for other in (a, b) if other != user.id}


def hidden_user_ids(viewer):
    """IDs de donos de perfil privado que `viewer` não tem permissão de ver."""
    private_user_ids = set(Profile.objects.filter(is_private=True).values_list("user_id", flat=True))
    if not private_user_ids:
        return private_user_ids
    if not viewer.is_authenticated:
        return private_user_ids
    private_user_ids.discard(viewer.id)
    return private_user_ids - accepted_friend_ids(viewer)
