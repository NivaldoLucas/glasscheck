from rest_framework import permissions, viewsets

from social.permissions import hidden_user_ids

from .models import CheckIn
from .serializers import CheckInSerializer


class CheckInViewSet(viewsets.ModelViewSet):
    """
    O registro central do GlassCheck (o "check-in" de um drink).
    Por padrão retorna os check-ins do usuário autenticado; o feed público
    (fora do MVP core) consulta esse mesmo endpoint com outros filtros.
    Check-ins de donos de perfil privado ficam de fora para quem não é o
    dono nem amigo aceito (ver social.permissions.hidden_user_ids).
    """

    serializer_class = CheckInSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
