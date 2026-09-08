# Build and serve the game when Railway's service root is this directory.
#
# The Dockerfile at the repo root does the same job for the case where the
# service root is the repo root; the only difference is the paths it copies
# from. Both end at the same Caddy image serving the same dist with the same
# cache headers, so whichever one Railway picks, the result is identical.
FROM node:lts-alpine AS build

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

WORKDIR /app

COPY package*.json ./
RUN npm ci

# tsc -b only reaches src and vite.config.ts (see tsconfig.app.json and
# tsconfig.node.json), so the tests, e2e journeys and art scripts that
# .railwayignore strips are genuinely not needed to build.
COPY . ./
RUN npm run build

FROM caddy:2-alpine

WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist ./

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
