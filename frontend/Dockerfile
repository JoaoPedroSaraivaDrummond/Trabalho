# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os manifestos de dependências
COPY package*.json ./
RUN npm ci

# Copia o código e faz o build de produção
COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:stable-alpine AS production

# Remove a config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a config customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos buildados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
