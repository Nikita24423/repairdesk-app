# RepairDesk

Аналитическое веб-приложение для учёта заявок на ремонт производственного оборудования и оценки эффективности их выполнения.

Краткое ТЗ: [TZ.md](./TZ.md)

## Стек

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Auth.js (credentials) + роли: admin / dispatcher / master
- PostgreSQL (Neon) + Drizzle ORM
- Recharts
- Деплой: Vercel

## Локальный запуск

1. Создайте базу Neon (или другую PostgreSQL) и скопируйте connection string.
2. Скопируйте env:

```bash
cp .env.example .env.local
```

Заполните:

- `DATABASE_URL` — строка подключения PostgreSQL
- `AUTH_SECRET` — случайная строка (`openssl rand -base64 32`)

3. Установите зависимости и примените схему:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Демо-учётки

Пароль для всех: `demo1234`

| Email | Роль |
|-------|------|
| admin@demo.local | Администратор |
| dispatcher@demo.local | Диспетчер |
| master1@demo.local | Мастер |
| master2@demo.local | Мастер |

## Деплой на Vercel

1. Подключите репозиторий к Vercel.
2. Добавьте Vercel Postgres / Neon и переменные:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` = URL продакшена (например `https://your-app.vercel.app`)
3. После первого деплоя локально (с prod `DATABASE_URL`) выполните:

```bash
npm run db:push
npm run db:seed
```

## Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Локальная разработка |
| `npm run build` | Сборка |
| `npm run db:push` | Применить схему к БД |
| `npm run db:seed` | Заполнить демо-данными |
