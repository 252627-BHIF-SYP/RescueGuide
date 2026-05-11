FROM node:18-alpine
WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm install --only=production

# Code kopieren
COPY . .

# Port exponieren
EXPOSE 3000

# Server starten
CMD ["node", "signalingserver.js"]