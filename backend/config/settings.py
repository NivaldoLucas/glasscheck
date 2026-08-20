"""
Django settings for GlassCheck.
"""

from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="django-insecure-change-me-in-prod")
DEBUG = config("DJANGO_DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Necessário à parte de ALLOWED_HOSTS: o Django exige a origem completa (com
# esquema) numa lista própria pra aceitar POSTs de formulário com sessão —
# usado pelo /admin/. Sem isso, login no admin por HTTPS dá 403 CSRF mesmo
# com o domínio já liberado em ALLOWED_HOSTS.
CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS", default="", cast=Csv())

# O gunicorn só enxerga HTTP puro (o nginx é quem termina o HTTPS na frente).
# Sem isto, request.is_secure() retorna False mesmo em produção — e a checagem
# de CSRF compara a Origin (https://...) contra um esquema errado (http://...)
# internamente, rejeitando o request mesmo com CSRF_TRUSTED_ORIGINS certo.
# O nginx.conf deste projeto já envia X-Forwarded-Proto — só falta o Django
# confiar nele.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # terceiros
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # apps do GlassCheck
    "accounts",
    "drinks",
    "establishments",
    "checkins",
    "social",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Banco de dados — Postgres em produção (via .env), SQLite como fallback local.
# DB_ENGINE em branco/ausente cai sempre no sqlite com nome fixo, ignorando
# POSTGRES_*/... que podem ter sobrado no .env de um setup Postgres.
# Os nomes POSTGRES_DB/USER/PASSWORD são os mesmos exigidos pela imagem oficial
# do Postgres — o serviço "db" do docker-compose lê o mesmo backend/.env, então
# usar os nomes dela aqui evita ter senha duplicada (e divergente) em dois lugares.
DB_ENGINE = config("DB_ENGINE", default="django.db.backends.sqlite3") or "django.db.backends.sqlite3"

if DB_ENGINE == "django.db.backends.sqlite3":
    DATABASES = {"default": {"ENGINE": DB_ENGINE, "NAME": BASE_DIR / "db.sqlite3"}}
else:
    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": config("POSTGRES_DB", default="glasscheck"),
            "USER": config("POSTGRES_USER", default=""),
            "PASSWORD": config("POSTGRES_PASSWORD", default=""),
            "HOST": config("DB_HOST", default=""),
            "PORT": config("DB_PORT", default=""),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Recife"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS — libera o frontend separado (web e, futuramente, o app mobile) a consumir a API.
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", default="http://localhost:5173,http://localhost:3000", cast=Csv()
)

# Django REST Framework
# Só TokenAuthentication de propósito — o app web usa exclusivamente token.
# SessionAuthentication ficava aqui só por conveniência da API navegável do
# DRF, mas causa um problema real em produção: se o mesmo navegador tiver
# uma sessão ativa do /admin/ (cookie de sessão do Django, nada a ver com
# o token do app), toda chamada de API passa a exigir CSRF por causa dessa
# sessão "estranha" — mesmo em rotas como /api/auth/login/ que nunca deveriam
# depender de sessão. /admin/ continua funcionando normalmente, pois usa a
# sessão do Django direto, sem passar por aqui.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Webhook de uma instância N8N externa (fora deste projeto) para automações com IA
# (busca de foto, sugestão de deduplicação).
N8N_WEBHOOK_BASE_URL = config("N8N_WEBHOOK_BASE_URL", default="")
