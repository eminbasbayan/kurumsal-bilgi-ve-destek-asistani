FROM node:22.22.0-bookworm-slim AS build
WORKDIR /app
COPY front-end/package.json front-end/package-lock.json ./
RUN npm ci
COPY front-end/ ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.28.0-alpine
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
