# GlassCheck — API

Backend Django + Django REST Framework do GlassCheck. Ver `glasscheck-conceito.md`
para o documento completo de produto (modelo de dados, decisões, stack).

## Estrutura

```
glasscheck/
├── backend/            # projeto Django (API)
│   ├── config/          # settings, urls
│   ├── accounts/        # Profile do usuário (bio, privacidade)
│   ├── drinks/           # catálogo global de drinks
│   ├── establishments/   # catálogo global de estabelecimentos
│   ├── checkins/         # o registro central (o "check-in" de um drink)
│   └── social/           # amizades/seguir (acesso a perfis privados)
└── docker-compose.yml   # Postgres + Django + N8N, para rodar na VPS
```

## Rodando localmente (sem Docker)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # ajuste se necessário — sqlite funciona out-of-the-box
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API disponível em `http://localhost:8000/api/`, admin em `http://localhost:8000/admin/`.

## Rodando com Docker (setup completo, igual à VPS)

```bash
cp backend/.env.example backend/.env   # ajuste DB_HOST=db, DB_ENGINE=postgres
docker compose up --build
```

Sobe Django (`:8000`), Postgres (`:5432`) e N8N (`:5678`).

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register/` | Cria usuário + Profile, devolve token |
| POST | `/api/auth/login/` | Login, devolve token |
| GET | `/api/auth/me/` | Perfil do usuário autenticado |
| GET/POST | `/api/drinks/?search=` | Catálogo de drinks — `search` é usado para checar duplicados |
| GET/POST | `/api/establishments/?search=` | Catálogo de estabelecimentos |
| GET/POST | `/api/checkins/?user=` | Registros (check-ins) |
| GET/POST | `/api/friendships/` | Solicitações de amizade |
| POST | `/api/friendships/{id}/accept/` | Aceitar solicitação |

Autenticação via `Authorization: Token <token>` (DRF TokenAuthentication).

## Próximos passos técnicos

1. **Deduplicação por IA**: hoje o endpoint `?search=` faz busca textual simples.
   O workflow N8N deve interceptar (via webhook chamado pelo Django antes de criar
   um Drink/Establishment novo) e usar IA para achar duplicatas por similaridade
   semântica, não só string exata.
2. **Busca de foto automática**: endpoint novo em `checkins` que chama um workflow
   N8N (Google Imagens) e retorna a URL sugerida para confirmação do usuário.
3. **Upload de imagem**: hoje `photo_url` é uma URL simples — decidir se o upload
   direto de arquivo (S3/local) entra no MVP ou se por ora só aceita URL.
4. **Frontend web**: criar projeto separado (React sugerido, dado o app mobile futuro).
5. **Deploy na VPS**: configurar Nginx como reverse proxy na frente do docker-compose,
   HTTPS via Let's Encrypt, e `DEBUG=False` + `DJANGO_ALLOWED_HOSTS` corretos em produção.
