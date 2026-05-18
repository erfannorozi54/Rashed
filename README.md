# Rashed Math School Platform

Full-stack educational platform for a math tutoring school in Tabriz, Iran.

## Local Development

**Requirements:** Docker, Node.js 20+

```bash
cp .env.example .env        # fill in values
docker compose up -d db     # start PostgreSQL
npm install
npx prisma migrate dev
npm run dev                 # http://localhost:3000
```

**Required `.env`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rashed_db"
NEXTAUTH_SECRET="supersecretkeychangeinproduction"
NEXTAUTH_URL="http://localhost:3000"
SMS_BASE_URL=""
```

---

## Deploying to a VPS

### Prerequisites
- VPS running Ubuntu with Docker and Git installed
- Domain pointed to VPS via Cloudflare (A record, orange cloud proxied)
- SSH access to the VPS

---

### Step 1 — Create project directory on VPS

```bash
ssh your-vps "mkdir -p /var/www/rashed"
```

---

### Step 2 — Sync project files

Run from your local machine inside the project directory:

```bash
rsync -avz --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  . your-vps:/var/www/rashed/
```

---

### Step 3 — Create `.env` on the VPS

```bash
ssh your-vps "cat > /var/www/rashed/.env << 'EOF'
DATABASE_URL=\"postgresql://postgres:postgres@db:5432/rashed_db\"
NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"
NEXTAUTH_URL=\"https://academy-rashed.ir\"
SMS_BASE_URL=\"\"
EOF"
```

> `DATABASE_URL` uses `db` as the hostname — this is the Docker service name, not `localhost`.

---

### Step 4 — Start the database

```bash
ssh your-vps "cd /var/www/rashed && docker compose up -d db"
```

Wait ~10 seconds for Postgres to be healthy.

---

### Step 5 — Build and start the app

```bash
ssh your-vps "cd /var/www/rashed && docker compose build app && docker compose up -d app"
```

Verify it started:
```bash
ssh your-vps "docker compose -f /var/www/rashed/docker-compose.yml logs app"
```

You should see:
```
No pending migrations to apply.
🌱  The seed command has been executed.
✓ Starting...
```

> Migrations and seed run automatically on every container start — no manual steps needed.

---

### Step 7 — Install Certbot and get SSL certificate

```bash
ssh your-vps "apt install -y certbot python3-certbot-nginx"

ssh your-vps "certbot certonly --nginx \
  -d academy-rashed.ir \
  -d www.academy-rashed.ir \
  --email your@email.com \
  --agree-tos \
  --non-interactive"
```

> This only works after DNS has propagated (Cloudflare nameservers active and A record set).

---

### Step 8 — Configure Nginx

```bash
ssh your-vps "cat > /etc/nginx/sites-available/academy-rashed << 'EOF'
server {
    listen 80;
    server_name academy-rashed.ir www.academy-rashed.ir;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name academy-rashed.ir www.academy-rashed.ir;

    ssl_certificate     /etc/letsencrypt/live/academy-rashed.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academy-rashed.ir/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"
```

Enable and reload:
```bash
ssh your-vps "ln -sf /etc/nginx/sites-available/academy-rashed /etc/nginx/sites-enabled/academy-rashed && nginx -t && systemctl reload nginx"
```

---

### Step 9 — Set Cloudflare SSL mode

In Cloudflare dashboard → **SSL/TLS → Overview** → set to **Full (Strict)**

---

## Redeploying After Code Changes

### Quick Deploy (Code Changes Only)

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

> **With new dependencies:** Also copy `package*.json` and install before building:
> ```bash
> ssh vps-ir "docker cp /var/www/rashed/package*.json rashed_app:/app/"
> ssh vps-ir "docker exec rashed_app npm config set registry https://package-mirror.liara.ir/repository/npm/ --global"
> ssh vps-ir "docker exec rashed_app npm install"
> ```

> Migrations and seed run automatically on startup. Postgres data persists in a named Docker volume.

### Troubleshooting

- **Logs:** `ssh vps-ir "docker compose logs app --tail=50"`
- **Rollback:** `ssh vps-ir "cd /var/www/rashed && git reset --hard HEAD~1"` then repeat steps 3-4

---

## Prisma Studio (Database UI)

To inspect the database via UI from your local browser:

```bash
ssh -L 5555:127.0.0.1:5555 your-vps \
  "docker exec rashed_app ./node_modules/.bin/prisma studio --port 5555 --browser none"
```

Then open `http://localhost:5555`. The SSH tunnel keeps it secure — port 5555 is not exposed to the internet.
