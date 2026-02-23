# Cloudflare + Nginx + Next.js — Request Flow

## Overview

```
Browser → Cloudflare Edge → Your VPS (Nginx) → Docker (Next.js :3001)
```

---

## Step-by-Step Flow

### 1. Browser makes a request to `https://academy-rashed.ir`

The browser does a DNS lookup for `academy-rashed.ir`. Because the A record in Cloudflare has the **orange cloud (proxied)**, DNS returns **Cloudflare's IP**, not your VPS IP `194.60.230.210`. The browser never knows your real server IP.

---

### 2. Cloudflare receives the request (Edge Network)

Cloudflare sits in between as a reverse proxy. It:
- Terminates the HTTPS connection from the browser using **Cloudflare's own SSL certificate** (the one browsers see)
- Applies your security rules (DDoS protection, firewall, rate limiting)
- Decides whether to serve from cache or forward to your VPS

---

### 3. Cloudflare forwards to your VPS

Because SSL mode is **Full (Strict)**, Cloudflare opens a **new encrypted HTTPS connection** to your VPS on port 443 using your Let's Encrypt certificate. This is the critical part:

```
Browser ←—HTTPS—→ Cloudflare ←—HTTPS—→ Your VPS
         (CF cert)            (Let's Encrypt cert)
```

Cloudflare adds headers to the forwarded request:
- `X-Forwarded-For: <real browser IP>`
- `X-Forwarded-Proto: https`
- `CF-Ray: <request ID>`
- `CF-Connecting-IP: <real browser IP>`

---

### 4. Nginx receives the request on port 443

Your Nginx config handles it with the second `server` block:

```nginx
server {
    listen 443 ssl;
    server_name academy-rashed.ir www.academy-rashed.ir;

    ssl_certificate     /etc/letsencrypt/live/academy-rashed.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academy-rashed.ir/privkey.pem;
```

Nginx:
1. Accepts the TLS handshake using the Let's Encrypt cert
2. Decrypts the request
3. Matches the `server_name` to know which config to use (important since other sites run on the same VPS)

---

### 5. Nginx proxies to Next.js

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
```

Nginx forwards the now-decrypted request to your Next.js Docker container on **plain HTTP** at `localhost:3001`. This is fine — it's internal loopback, never leaves the machine.

The proxy headers tell Next.js the real context:

| Header | Purpose |
|--------|---------|
| `proxy_set_header Host $host` | Next.js knows the domain being requested |
| `proxy_set_header X-Real-IP $remote_addr` | Logs Cloudflare's IP (not the browser's — use `CF-Connecting-IP` for the real IP) |
| `proxy_set_header X-Forwarded-For` | Chain of IPs the request passed through |
| `proxy_set_header X-Forwarded-Proto $scheme` | Tells Next.js the original request was `https`, so it doesn't redirect to http |
| `proxy_set_header Upgrade / Connection` | Required for WebSocket support |
| `proxy_cache_bypass $http_upgrade` | Skips cache for WebSocket upgrade requests |

---

### 6. HTTP redirect block

```nginx
server {
    listen 80;
    server_name academy-rashed.ir www.academy-rashed.ir;
    return 301 https://$host$request_uri;
}
```

If anyone hits port 80 (plain HTTP) — including Cloudflare itself if it ever connects on port 80 — Nginx immediately redirects to HTTPS. In practice, because Cloudflare's "Always Use HTTPS" setting is on, Cloudflare handles this redirect before it even reaches your VPS.

---

## Why Two SSL Certificates?

| Certificate | Where | Seen By |
|------------|-------|---------|
| Cloudflare Edge cert | Cloudflare's servers | The browser |
| Let's Encrypt cert | Your VPS | Cloudflare only |

The browser never sees your Let's Encrypt cert — it only sees Cloudflare's cert. In **Full (Strict)** mode, Cloudflare validates that your Let's Encrypt cert is legitimate (not self-signed, not expired). In plain **Full** mode, it would accept even a self-signed cert.

---

## SSL Mode Comparison

```
Full (Strict): Browser → CF ←verified→ VPS
Full:          Browser → CF ←unverified→ VPS  (accepts self-signed)
Flexible:      Browser → CF ←plain HTTP→ VPS  (no encryption to VPS)
Off:           Browser ←plain HTTP→ VPS        (no encryption at all)
```

---

## Visual Summary

```
┌─────────┐        ┌───────────────────┐        ┌──────────────────────────────────┐
│ Browser │        │   Cloudflare Edge │        │         Your VPS                 │
│         │        │                   │        │                                  │
│ HTTPS   │◄──────►│ CF SSL cert       │◄──────►│ Nginx :443 (Let's Encrypt cert)  │
│ :443    │        │ DDoS protection   │        │   │                              │
│         │        │ Caching           │        │   └─► Nginx proxies to           │
│         │        │ Firewall          │        │       localhost:3001             │
└─────────┘        └───────────────────┘        │         │                        │
                                                │         └─► Docker: Next.js      │
                                                │             rashed_app           │
                                                └──────────────────────────────────┘
```

Your VPS IP `194.60.230.210` is **never exposed** to the browser — all traffic enters and exits through Cloudflare.
