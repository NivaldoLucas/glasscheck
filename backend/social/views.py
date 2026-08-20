from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Friendship
from .serializers import FriendshipSerializer


class FriendshipViewSet(viewsets.ModelViewSet):
    """
    Solicitações de amizade — usadas para dar acesso a perfis privados
    (ver decisão de privacidade no documento de conceito).
    """

    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(from_user=user) | Friendship.objects.filter(to_user=user)

    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        friendship = self.get_object()
        if friendship.to_user_id != request.user.id:
            raise PermissionDenied("Só quem recebeu a solicitação pode aceitá-la.")
        friendship.status = "accepted"
        friendship.save()
        return Response(self.get_serializer(friendship).data)
