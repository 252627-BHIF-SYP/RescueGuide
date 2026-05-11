# 1. Build Stage
FROM node:22 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# 2. Production Stage
FROM nginx:alpine

# nginx.conf kopieren
COPY nginx.conf /etc/nginx/nginx.conf

# Built app kopieren
COPY --from=build /app/dist/controlcenter-frontend/browser /usr/share/nginx/html/

# Port exponieren
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# nginx starten
CMD ["nginx", "-g", "daemon off;"]

