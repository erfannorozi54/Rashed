# Deployment Update Guide

## VPS Constraints

- No internet access (use Liara mirror: `https://package-mirror.liara.ir/repository/npm/`)
- Existing Docker image with dependencies installed
- Updates are temporary (lost on container rebuild)

## Update Process

### 1. Commit Local Changes
```bash
cd /home/erfan/Projects/Rashed
git add .
git commit -m "Description"
```

### 2. Create & Transfer Git Bundle
```bash
git bundle create /tmp/rashed-update.bundle HEAD
scp /tmp/rashed-update.bundle vps-ir:/tmp/
```

### 3. Update VPS Code
```bash
ssh vps-ir "cd /var/www/rashed && git pull /tmp/rashed-update.bundle main"
```

### 4. Copy to Container & Rebuild
```bash
ssh vps-ir "docker cp /var/www/rashed/src rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm run build"
ssh vps-ir "cd /var/www/rashed && docker compose restart app"
```

### 5. If New Dependencies Added
```bash
ssh vps-ir "docker cp /var/www/rashed/package*.json rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm config set registry https://package-mirror.liara.ir/repository/npm/ --global"
ssh vps-ir "docker exec rashed_app npm install"
# Then repeat step 4
```

## Troubleshooting

**Check logs:** `ssh vps-ir "docker compose logs app --tail=50"`  
**Rollback:** `ssh vps-ir "cd /var/www/rashed && git reset --hard HEAD~1"` then repeat step 4
