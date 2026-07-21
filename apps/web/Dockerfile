# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /repo

FROM base AS build
ARG NEXT_PUBLIC_API_URL=same-origin
ARG API_REWRITE_URL=http://api:4001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_REWRITE_URL=$API_REWRITE_URL
ENV API_URL=$API_REWRITE_URL
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN --mount=type=cache,id=inabiya-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @inabiya/types build \
 && pnpm --filter @inabiya/validation build \
 && pnpm --filter @inabiya/web build

FROM base AS runner
ENV NODE_ENV=production
ENV WEB_PORT=3001
WORKDIR /repo
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/web ./apps/web
WORKDIR /repo/apps/web
EXPOSE 3001
CMD ["pnpm", "exec", "next", "start", "-p", "3001"]
