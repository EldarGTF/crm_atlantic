# Roadmap Atlantic CRM

Реализовано в ветке `main` (после VPS-деплоя):

1. Удаление файлов из MinIO при удалении в CRM  
2. Уникальный номер заказа (`order_number`, отображение `№00001`)  
3. Дубликаты клиентов по телефону при создании  
4. Глобальный поиск в шапке  
5. Уведомления в CRM (колокольчик)  
6. Фильтры заказов: оплата + этап заявки + поиск по №  
7. Сжатие фото перед загрузкой (>400 KB)  
8. PWA manifest (`/manifest.json`)  
9. Очередь производства по цехам (вкладки на `/production`)  
10. Календарь замеров и монтажей (`/calendar`)  
11. Чек-лист монтажа на карточке монтажа  

## После `git pull` на VPS

```bash
cd /opt/crm_atlantic
git pull
docker compose down
docker compose build app
docker compose up -d
docker compose exec app npx prisma db push
```

Добавьте иконки PWA (опционально): `public/icon-192.png`, `public/icon-512.png`.

## Дальше (идеи)

- HTTPS + домен  
- Автобэкапы PostgreSQL и MinIO  
- PDF КП / договор  
- WhatsApp / Telegram уведомления  
- Дебиторка и воронка конверсии  
