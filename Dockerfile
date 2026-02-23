FROM node:24-alpine

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm install prisma@7 @prisma/client@7 @prisma/adapter-pg@7

COPY . .

RUN ./node_modules/.bin/prisma generate
RUN npm run build

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/prisma db seed && npm start"]

