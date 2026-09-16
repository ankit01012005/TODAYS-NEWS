# Today_news API — production image.
#
# Multi-stage so the shipped layer holds no compiler, no dev dependencies
# and no source: what runs is dist/ plus the production node_modules and
# the generated Prisma client.
#
# docs/27 B2. Migrations are deliberately NOT run from here — the release
# pipeline runs `prisma migrate deploy` as its own step, once, before the
# new image takes traffic. An image that migrates on boot would race with
# itself the moment a second replica starts.

# --- build ------------------------------------------------------------------
FROM node:24.21.0-alpine AS build
WORKDIR /app

# The schema is copied before `npm ci` because @prisma/client's postinstall
# generates the client from it; without it the install produces a stub that
# throws at the first query.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# Drop to production dependencies only. The generated client is preserved
# across the prune by hand rather than regenerated: `prisma` is a
# devDependency, so after pruning `npx prisma generate` would silently
# fetch the CLI from the network — a package download in the middle of an
# image build, resolved at build time rather than from the lockfile.
RUN cp -r node_modules/.prisma /tmp/prisma-client \
 && npm prune --omit=dev \
 && rm -rf node_modules/.prisma \
 && cp -r /tmp/prisma-client node_modules/.prisma \
 && rm -rf /tmp/prisma-client

# --- runtime ----------------------------------------------------------------
FROM node:24.21.0-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Node's own default heap is sized for the host, not the container; without
# this a memory-limited container is OOM-killed rather than running GC.
ENV NODE_OPTIONS="--max-old-space-size=384"

# Signals reach PID 1 only through an init: without one, SIGTERM never
# arrives and main.ts's graceful shutdown never runs, so every deploy drops
# in-flight requests.
RUN apk add --no-cache tini

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json ./
COPY --chown=node:node scripts ./scripts

# Never root: an upload-handling process that is compromised should not own
# the filesystem it runs on.
USER node

EXPOSE 3001

# The orchestrator's own probe should hit /ready (it checks the database);
# this one is the container's liveness view, matching /health's contract of
# "the process is alive" — a database hiccup must not restart the process.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||3001,path:'/health',timeout:4000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
