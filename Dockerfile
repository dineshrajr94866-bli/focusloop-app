# Stage 1: Build Frontend (Vite + React)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app

# Native build tools needed for better-sqlite3 compilation if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev && npm rebuild better-sqlite3

COPY server/ ./
COPY --from=frontend-builder /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]
