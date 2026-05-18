# Deployment Update Guide

## VPS Constraints

- No internet access (use Liara mirror: `https://package-mirror.liara.ir/repository/npm/`)
- Container: `rashed_app`, path: `/var/www/rashed`

## Quick Deploy (Code Changes Only)

```bash
# 1. Commit and push
git add . && git commit -m "Description" && git push origin main

# 2. Pull on VPS
ssh vps-ir "cd /var/www/rashed && git pull origin main"

# 3. Copy changed files to container
ssh vps-ir "docker cp /var/www/rashed/src rashed_app:/app/"

# 4. Build and restart
ssh vps-ir "docker exec rashed_app npm run build"
ssh vps-ir "cd /var/www/rashed && docker compose restart app"
```

## With New Dependencies

```bash
ssh vps-ir "docker cp /var/www/rashed/package*.json rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm config set registry https://package-mirror.liara.ir/repository/npm/ --global"
ssh vps-ir "docker exec rashed_app npm install"
# Then build and restart
```

## Troubleshooting

**Logs:** `ssh vps-ir "docker compose logs app --tail=50"`  
**Rollback:** `ssh vps-ir "cd /var/www/rashed && git reset --hard HEAD~1"` then repeat steps 3-4
