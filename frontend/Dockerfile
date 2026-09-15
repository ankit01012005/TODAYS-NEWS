# ANVAY TV — public site and CMS, production image.
#
# Built on Next's standalone output (next.config.ts): the runtime layer
# carries server.js and only the node_modules actually reached at runtime,
# not the build toolchain.
#
# docs/27 B2. Note which variables matter WHEN:
#   build time — SITE_URL, because robots.txt and the sitemap are
#                prerendered and bake the origin in.
#   run time   — API_BASE_URL and REVALIDATE_SECRET, read per request.
# SITE_URL must therefore be supplied to `docker build`, not only to
# `docker run`, or the feed and sitemap ship pointing at localhost.

# --- build ------------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The build never contacts the API (docs/27 A6) — an API outage must not be
# able to block a frontend deploy.
ARG SITE_URL=http://localhost:3000
ENV SITE_URL=${SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime ----------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache tini

# standalone leaves `public` and `.next/static` out on purpose (it expects
# a CDN); copied in here so the image also works served directly.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/robots.txt',timeout:4000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
