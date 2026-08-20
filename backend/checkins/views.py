from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from social.permissions import hidden_user_ids

from .models import CheckIn
from .serializers import CheckInSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Só o dono do check-in pode editar (PATCH/PUT) ou apagar (DELETE) ele."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class CheckInViewSet(viewsets.ModelViewSet):
    """
    O registro central do GlassCheck (o "check-in" de um drink).
    Por padrão retorna os check-ins do usuário autenticado; o feed público
    (fora do MVP core) consulta esse mesmo endpoint com outros filtros.
    Check-ins de donos de perfil privado ficam de fora para quem não é o
    dono nem amigo aceito (ver social.permissions.hidden_user_ids).
    """

    serializer_class = CheckInSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = CheckIn.objects.select_related("drink", "establishment", "user").exclude(
            user_id__in=hidden_user_ids(self.request.user)
        )
        user_id = self.request.query_params.get("user")
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def set_cover(self, request, pk=None):
        """Define este check-in como a capa do drink no catálogo do próprio usuário."""
        checkin = self.get_object()  # já aplica IsOwnerOrReadOnly (POST não é SAFE_METHOD)
        CheckIn.objects.filter(user=request.user, drink_id=checkin.drink_id, is_cover=True).update(is_cover=False)
        checkin.is_cover = True
        checkin.save(update_fields=["is_cover"])
        return Response(self.get_serializer(checkin).data)
