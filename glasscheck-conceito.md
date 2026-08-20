# GlassCheck — Documento de Conceito

## 1. Visão geral

**O que é:** um "Letterboxd para drinks" — plataforma de catalogação pessoal de bebidas/coquetéis, com camada social secundária (feed).

**Foco principal:** o usuário registrar, avaliar e guardar um histórico dos drinks que já experimentou — como um álbum de figurinhas. A rede social (feed) é um recurso adicional, não o centro do produto.

**Plataforma:** começa como site (web app), com plano de virar app mobile no futuro.

---

## 2. Funcionalidades principais (MVP)

### 2.1 Perfil de usuário
- Cadastro/login
- Perfil pessoal com o "catálogo" de drinks já registrados
- Estatísticas básicas (quantos drinks, quantos estabelecimentos, drink favorito, etc.) — bom gancho pro efeito "álbum de figurinhas"

### 2.2 Registro de drink (o core do produto)
Cada registro ("check-in" de drink) tem:
| Campo | Obrigatório? |
|---|---|
| Foto do drink | **Obrigatório** (se o usuário não enviar, sistema busca no Google Imagens e pede confirmação do usuário antes de salvar) |
| Nome do drink | Obrigatório |
| Estabelecimento/local | Opcional |
| Nota | Opcional — estrelas de 0 a 5 |
| Comentário | Opcional |
| Data | Automática (data do post) |

*(Privacidade não é campo do registro — é definida no perfil do usuário, ver seção 5.)*

- Um mesmo drink (ex: "Caipirinha") pode ter **múltiplos registros independentes** — um por local/ocasião diferente. Ou seja, não é "editar" o drink existente, é criar um novo registro vinculado ao mesmo drink-base.

### 2.3 Deduplicação inteligente
- Ao cadastrar um **drink**, o sistema consulta o banco (e/ou usa IA) pra verificar se aquele drink já existe na base geral, evitando duplicar (ex: "Mojito" vs "mojito" vs "Mojito clássico").
- Mesmo processo para **estabelecimentos** (nome do bar/restaurante).
- Isso sugere a necessidade de duas entidades "catálogo" separadas dos "registros pessoais": um catálogo global de Drinks e um catálogo global de Estabelecimentos, que os usuários vinculam aos seus posts.

### 2.4 Feed (secundário)
- Timeline com os registros de outros usuários (ou de quem você segue)
- Curtidas/comentários — nível de prioridade a definir depois do MVP

---

## 3. Modelo de dados (rascunho inicial)

```
Usuário
 ├─ id, nome, email, foto_perfil, bio...
 ├─ privacidade (público | privado) — padrão: público

Drink (catálogo global)
 ├─ id, nome, categoria (opcional: coquetel, cerveja, vinho...), foto_padrao (fallback)

Estabelecimento (catálogo global)
 ├─ id, nome, localização/endereço (opcional), foto_padrao

Registro (o "check-in" — entidade central)
 ├─ id, usuário_id, drink_id, estabelecimento_id (opcional)
 ├─ foto (do usuário OU puxada da web, com confirmação do usuário)
 ├─ nota (opcional, estrelas 0-5), comentário (opcional)
 ├─ data_criação

Relação de Amizade/Seguir
 ├─ usuário_origem_id, usuário_destino_id, status (pendente/aceito)
 (necessário desde o MVP para dar acesso a perfis privados)
```

---

## 4. Funcionalidades futuras (pós-MVP)
- App mobile nativo
- Sistema de "conquistas"/badges (reforça o efeito álbum de figurinhas — ex: "provou 10 drinks diferentes", "visitou 5 bares")
- Listas personalizadas (ex: "drinks pra verão", "quero provar")
- Recomendações baseadas no histórico
- Busca avançada por ingrediente, categoria, local
- Feed social mais robusto (seguir usuários, curtidas, comentários)
- Ranking de drinks/estabelecimentos mais bem avaliados pela comunidade

---

## 5. Decisões tomadas

1. **Estabelecimento não é obrigatório.** O usuário pode registrar um drink sem vincular a um local (ex: feito em casa).
2. **Nota:** sistema de estrelas, de 0 a 5.
3. **Foto automática:** busca via Google Imagens, mas o sistema **sempre confirma com o usuário** antes de usar a foto (evita erro e reduz risco de direitos autorais indevidos — o usuário valida a escolha).
4. **Catálogo global de drinks/estabelecimentos é aberto** — qualquer usuário pode cadastrar um novo drink/local, entra na base global (com deduplicação automática, ver item abaixo).
5. **Privacidade:** é uma configuração do **perfil**, não do registro individual. Por padrão o perfil é **público**; o usuário pode torná-lo **privado**, visível apenas para amigos/seguidores. Isso implica que o MVP já precisa de algum sistema básico de "seguir"/"amigos" (para solicitar acesso a perfis privados), semelhante ao Instagram.

5. **Deduplicação:** a checagem acontece **no momento do clique em "Salvar"**. O sistema busca no catálogo global por nomes semelhantes (drink e/ou estabelecimento) e, se encontrar possíveis correspondências, apresenta ao usuário antes de confirmar o registro (ex: "Já existe 'Caipirinha' no catálogo — é esse?"). Se não houver correspondência, cria uma entrada nova.

---

## 7. Stack técnica

- **Backend/API:** Python + Django, com Django REST Framework expondo uma API própria — desacoplada do frontend, pra já preparar o terreno pro app mobile futuro.
- **Frontend web:** aplicação separada, consumindo a API (a definir: React ou outro framework — ver próximos passos).
- **Automações com IA (N8N):** fluxos que envolvem IA — como a busca de foto no Google Imagens e a sugestão de deduplicação de drinks/estabelecimentos — rodam como workflows no N8N, acionados via webhook/endpoint a partir do Django. Caso algum fluxo fique complexo demais ou vire gambiarra dentro do N8N, migra para função nativa no Django.
- **Hospedagem:** VPS própria (Django/API, N8N e frontend web hospedados lá).
- **App mobile (futuro):** consome a mesma API do Django — por isso a separação API/frontend desde o início é importante.

---

## 8. Próximos passos sugeridos

1. Desenhar as demais telas principais (perfil/catálogo pessoal, feed, detalhe de drink/estabelecimento)
2. Definir o framework do frontend web (ex: React) e a estrutura de pastas API + frontend
3. Modelar o banco de dados no Django (apps: usuários, drinks, estabelecimentos, registros, amizades)
4. Desenhar os primeiros workflows do N8N (busca de foto, sugestão de deduplicação) e seus contratos de webhook com o Django

