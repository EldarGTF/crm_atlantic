#!/bin/sh
# Обновление CRM на VPS. Требуется Docker Compose v2: `docker compose` (не docker-compose 1.29).
# Запуск: cd /opt/crm_atlantic && bash scripts/deploy.sh
set -e

cd "$(dirname "$0")/.."

if ! docker compose version >/dev/null 2>&1; then
  echo "Ошибка: нужен Docker Compose v2 (команда «docker compose»)."
  echo "  sudo apt install -y docker-compose-plugin"
  echo "  sudo apt remove -y docker-compose   # удалить старый 1.29, если есть"
  exit 1
fi

if [ -d .git ]; then
  git pull origin main 2>/dev/null || git pull
fi

docker compose down
docker compose build app
docker compose up -d

echo "Ожидание postgres..."
sleep 5
docker compose exec -T app npx prisma db push

docker compose ps
echo "Готово."
