# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable \
 && corepack prepare pnpm@8.15.0 --activate
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY prisma ./prisma
RUN --mount=type=cache,id=inabiya-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm db:generate \
 && pnpm --filter @inabiya/types build \
 && pnpm --filter @inabiya/validation build \
 && pnpm --filter @inabiya/api build

FROM base AS runner
ENV NODE_ENV=production
ENV API_PORT=4001
WORKDIR /repo
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api ./apps/api
COPY --from=build /repo/prisma ./prisma
WORKDIR /repo/apps/api
EXPOSE 4001
CMD ["node", "dist/main.js"]
