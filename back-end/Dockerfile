FROM node:22.22.0-bookworm-slim AS build
WORKDIR /app
COPY back-end/package.json back-end/package-lock.json ./
RUN npm ci
COPY back-end/tsconfig.json ./
COPY back-end/src ./src
RUN npm run build

FROM node:22.22.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    DATABASE_PATH=/data/app.sqlite
COPY back-end/package.json back-end/package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /data
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "mkdir -p /data && chown node:node /data && exec runuser -u node -- node dist/index.js"]
