FROM node:24-bookworm-slim
WORKDIR /app

# Keep the lockfile authoritative, including the bundler needed by web:build.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run web:build \
    && mkdir -p /data /backups \
    && chown node:node /data /backups

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8770 DATA_DIR=/data
USER node
EXPOSE 8770
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "web/server.mjs"]
