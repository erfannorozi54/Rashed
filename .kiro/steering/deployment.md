# Deployment & Dev Notes

## VPS

- SSH alias: `ssh vps-ir` (194.60.230.210)
- Project path: `/var/www/rashed`
- Repo cloned via HTTPS: `https://github.com/erfannorozi54/Rashed.git`
- `.env` lives only on VPS at `/var/www/rashed/.env` — not in git, restore manually if re-cloning

## Deploy Updates

After pushing to GitHub:

```bash
ssh vps-ir "cd /var/www/rashed && git pull origin main && docker compose up -d --build"
```

All services (app + database) are managed **exclusively via `docker compose up -d`**. Do not use rsync or any other deployment method.

## Local Setup

```bash
docker-compose up -d          # Start PostgreSQL
npm install
npx prisma migrate dev
npm run dev                   # localhost:3000
```

**Required `.env`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rashed_db"
NEXTAUTH_SECRET="supersecretkeychangeinproduction"
NEXTAUTH_URL="http://localhost:3000"
```

## Prisma

```bash
npx prisma studio                        # Browse DB
npx prisma migrate dev --name <name>     # New migration
npx prisma generate                      # After schema changes
```
