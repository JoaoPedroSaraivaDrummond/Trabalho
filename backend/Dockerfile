# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app

# Instala openssl necessário para o Prisma Engine
RUN apt-get update -y && apt-get install -y openssl

# Copia os manifestos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDeps para gerar o Prisma Client)
RUN npm ci

# Gera o Prisma Client
RUN npx prisma generate

# ---- Production stage ----
FROM node:20-slim AS production

WORKDIR /app

# Instala openssl no container de produção
RUN apt-get update -y && apt-get install -y openssl

# Copia os manifestos e instala apenas deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o Prisma Client gerado e o schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY prisma ./prisma/

# Copia o código-fonte
COPY src ./src/

EXPOSE 5000

# Roda as migrations e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

