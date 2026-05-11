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
COPY --from=build /app/dist/clientapp-frontend/browser /usr/share/nginx/html/

# Port exponieren
EXPOSE 80

# nginx starten
CMD ["nginx", "-g", "daemon off;"]
