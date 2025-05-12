# Étape 1 : Builder
FROM node:23.10.0-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache openssl libc6-compat curl

COPY package*.json ./
RUN npm install

COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# Étape 2 : Runner
FROM node:23.10.0-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main"]
