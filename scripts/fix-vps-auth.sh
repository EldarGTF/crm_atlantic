#!/bin/sh
# Запуск на VPS: cd /opt/crm_atlantic && sudo bash scripts/fix-vps-auth.sh
set -e

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
echo "==> CRM fix: $ROOT"

# --- .env ---
if [ ! -f .env ]; then
  cp .env.vps.example .env
  echo "Создан .env из примера — задайте пароли и SESSION_SECRET, затем запустите снова."
  exit 1
fi

grep -q '^COOKIE_SECURE=' .env 2>/dev/null || echo 'COOKIE_SECURE=false' >> .env
if grep -q '^COOKIE_SECURE=' .env; then
  sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=false/' .env
fi

grep -q '^S3_PUBLIC_URL=' .env 2>/dev/null || echo 'S3_PUBLIC_URL=http://185.129.51.148/files' >> .env
sed -i 's|^S3_PUBLIC_URL=.*|S3_PUBLIC_URL=http://185.129.51.148/files|' .env

if ! grep -q '^SESSION_SECRET=.' .env || [ "$(grep '^SESSION_SECRET=' .env | cut -d= -f2- | tr -d '"' | wc -c)" -lt 33 ]; then
  echo "SESSION_SECRET слишком короткий или пустой. Добавьте в .env строку ≥32 символов в кавычках."
  exit 1
fi

# SESSION_SECRET в кавычках, если есть # или $
SECRET_LINE=$(grep '^SESSION_SECRET=' .env | head -1)
case "$SECRET_LINE" in
  *'#'*|*'$'*)
    if ! echo "$SECRET_LINE" | grep -q '^SESSION_SECRET="'; then
      VAL=$(echo "$SECRET_LINE" | cut -d= -f2-)
      sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=\"$VAL\"|" .env
      echo "SESSION_SECRET обёрнут в кавычки (# и \$ безопасны для .env)"
    fi
    ;;
esac

# --- Docker Compose v2 only (не docker-compose 1.29 — KeyError ContainerConfig) ---
if ! docker compose version >/dev/null 2>&1; then
  echo "Ошибка: нужен Docker Compose v2: «docker compose»"
  echo "  sudo apt install -y docker-compose-plugin"
  echo "  sudo apt remove -y docker-compose"
  exit 1
fi
DC="docker compose"
echo "==> $(docker compose version | head -1)"

if [ -d .git ]; then
  echo "==> git pull (если есть обновления)"
  git pull origin main 2>/dev/null || git pull 2>/dev/null || true
fi

$DC down 2>/dev/null || true
docker rm -f crm_atlantic_app_1 crm_atlantic_nginx_1 crm_atlantic_postgres_1 crm_atlantic_minio_1 crm_atlantic_minio-init_1 2>/dev/null || true

echo "==> Сборка app (может занять несколько минут)"
$DC build app
$DC up -d
echo "==> Ждём postgres..."
sleep 8

echo "==> Prisma db push"
$DC exec -T app npx prisma db push

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@atlantic.kz}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [ -z "$ADMIN_PASSWORD" ]; then
  if grep -q '^ADMIN_PASSWORD=.' .env; then
    ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '"')
  fi
fi

if [ -z "$ADMIN_PASSWORD" ] || [ ${#ADMIN_PASSWORD} -lt 8 ]; then
  echo "Задайте ADMIN_PASSWORD в .env (≥8 символов) и запустите:"
  echo "  ADMIN_PASSWORD='ваш_пароль' bash scripts/fix-vps-auth.sh"
  exit 1
fi

echo "==> Создаём/обновляем админа: $ADMIN_EMAIL"
$DC run --rm -T \
  -v "$ROOT/scripts:/app/scripts:ro" \
  -e "ADMIN_EMAIL=$ADMIN_EMAIL" \
  -e "ADMIN_PASSWORD=$ADMIN_PASSWORD" \
  --entrypoint npx \
  app tsx scripts/create-admin.ts

echo ""
echo "==> Пользователи в БД:"
$DC exec -T postgres psql -U crm -d crm_atlantic -c "SELECT email, role, active FROM users;"

echo ""
echo "==> COOKIE_SECURE в контейнере:"
$DC exec -T app printenv COOKIE_SECURE NODE_ENV

echo ""
echo "=============================================="
echo "Готово."
echo "1. Браузер: инкогнито"
echo "2. Откройте: http://185.129.51.148"
echo "3. Вход: $ADMIN_EMAIL / (пароль из ADMIN_PASSWORD в .env)"
echo "4. Проверьте: http://185.129.51.148/orders"
echo "=============================================="
