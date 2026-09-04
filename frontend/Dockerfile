# Builds the static SPA, then serves it from nginx — the same output an
# Azure Static Web App deployment would produce, containerised for local
# parity or for hosts (Container Apps, App Service) that expect an image.

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The API base URL is baked in at build time — pass a different value per
# environment, e.g. `docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api`.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
