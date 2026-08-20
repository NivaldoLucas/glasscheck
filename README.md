# GlassCheck — API

Backend Django + Django REST Framework do GlassCheck. Ver `glasscheck-conceito.md`
para o documento completo de produto (modelo de dados, decisões, stack).

## Estrutura

```
glasscheck/
├── backend/            # projeto Django (API)
│   ├── config/          # settings, urls
│   ├── accounts/        # Profile do usuário (bio, avatar, privacidade)
│   ├── drinks/           # catálogo global de drinks
│   ├── establishments/   # catálogo global de estabelecimentos
│   ├── checkins/         # o registro central (o "check-in" de um drink)
│   ├── social/           # amizades (acesso a perfis privados)
│   ├── entrypoint.sh     # migrate + collectstatic + gunicorn (usado só no Docker)
│   └── Dockerfile
├── frontend/            # Vite + React, consome a API
│   ├── Dockerfile        # build multi-stage: node build -> nginx serve
│   └── nginx.conf        # serve o SPA + faz proxy de /api, /admin, /static, /media
└── docker-compose.yml   # db + backend + nginx, para rodar na VPS
```

Deduplicação semântica e busca automática de foto (Google Imagens) são feitas por
uma instância N8N **externa** a este projeto — não sobe via docker-compose aqui.
Configure a URL dela em `N8N_WEBHOOK_BASE_URL` no `.env`.

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
cp backend/.env.example backend/.env   # ajuste os valores, ver abaixo
docker compose up --build -d
docker compose exec backend python manage.py createsuperuser
```

Sobe três serviços: `db` (Postgres, só na rede interna), `backend` (gunicorn, só na
rede interna) e `nginx` (porta `:80` — serve o frontend buildado e faz proxy de
`/api/`, `/admin/`, `/static/` e `/media/` pro backend). Migrations e
`collectstatic` rodam automaticamente toda vez que o container `backend` sobe
(ver `backend/entrypoint.sh`).

Nada de `DB_ENGINE` em branco aqui — configure Postgres no `.env`:

```
DB_ENGINE=django.db.backends.postgresql
POSTGRES_DB=glasscheck
POSTGRES_USER=glasscheck
POSTGRES_PASSWORD=<senha forte>
DB_HOST=db
DB_PORT=5432
```

`db` e `backend` leem o **mesmo** `backend/.env` — por isso os nomes das
variáveis (`POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD`) são exatamente os
que a imagem oficial do Postgres espera, evitando senha divergente em dois
lugares.

## Deploy numa VPS

Pré-requisito na VPS: Docker + Docker Compose instalados (`curl -fsSL
https://get.docker.com | sh` funciona na maioria das distros).

```bash
# 1. na sua máquina: suba o código pro GitHub
git push origin main

# 2. na VPS: clone o repositório
git clone https://github.com/NivaldoLucas/glasscheck.git
cd glasscheck

# 3. configure o ambiente de produção
cp backend/.env.example backend/.env
nano backend/.env
```

No `backend/.env` da VPS, ajuste:
- `DJANGO_SECRET_KEY` — gere uma nova: `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=seu-dominio.com,ip-da-vps`
- `DB_ENGINE=django.db.backends.postgresql` + `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` (senha forte, diferente do exemplo)
- `CORS_ALLOWED_ORIGINS` não precisa mudar — o frontend buildado fala com a API
  pelo mesmo domínio (`/api`), sem CORS envolvido

```bash
# 4. suba tudo
docker compose up --build -d

# 5. crie seu usuário admin
docker compose exec backend python manage.py createsuperuser

# 6. confira
docker compose ps
docker compose logs backend --tail=50
```

Abra `http://ip-da-vps` (ou seu domínio, se já apontou o DNS) — o site deve
estar no ar na porta 80.

**HTTPS (próximo passo, não bloqueia o "ver funcionando")**: depois que o DNS
do domínio estiver apontando pra VPS, o caminho mais simples é rodar um
container do Certbot (ou instalar `certbot` direto na VPS) apontando pro
`nginx` deste compose, ou trocar o `nginx` daqui por uma instância com
Nginx Proxy Manager / Caddy na frente. Isso fica pro próximo passo, combinado.

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
Check-in aceita foto por upload direto (`photo`, multipart) ou por URL (`photo_url`,
usada pelo fluxo de busca automática) — pelo menos um dos dois é obrigatório.

## Rodando os testes

```bash
cd backend
python manage.py test
```

## Próximos passos técnicos

1. **Deduplicação por IA**: hoje o endpoint `?search=` faz busca textual simples.
   A instância N8N externa deve ser chamada (via webhook, a partir do Django antes
   de criar um Drink/Establishment novo) para achar duplicatas por similaridade
   semântica, não só string exata.
2. **Busca de foto automática**: endpoint novo em `checkins` que chama o webhook
   N8N externo (Google Imagens) e retorna a URL sugerida para confirmação do
   usuário antes de salvar.
3. **HTTPS na VPS**: hoje o deploy sobe só em HTTP (`:80`) — falta Let's Encrypt/Certbot
   na frente do `nginx` do compose (ver seção "Deploy numa VPS" acima).
