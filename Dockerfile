# syntax=docker/dockerfile:1

# ---- build: instala dependencias y genera dist/ ----
FROM node:22-alpine AS build
WORKDIR /app

# El lockfile se generó con npm 11; el npm 10 que trae node:22 lo rechaza por dependencias
# opcionales de Linux (@emnapi/*). Uso la misma versión mayor para que `npm ci` sea reproducible.
RUN npm install -g npm@11.6.1 --no-fund --no-audit

COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

COPY . .

# Vite incrusta VITE_API_URL en el bundle al compilar: se pasa como build arg.
#   docker build --build-arg VITE_API_URL=http://localhost:8080 -t frontend-asa .
ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "Falta --build-arg VITE_API_URL" >&2 && exit 1)
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- runtime: nginx sirviendo los estáticos ----
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
