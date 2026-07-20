# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN --mount=type=cache,id=inabiya-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @inabiya/worker build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/worker ./apps/worker
WORKDIR /repo/apps/worker
CMD ["node", "dist/main.js"]
