FROM node:22-slim AS base
RUN npm install -g pnpm@10.28.2
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared shared
COPY backend backend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @promptforge/backend run build

FROM node:22-slim AS runtime
RUN npm install -g pnpm@10.28.2
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=base /app/shared shared
COPY --from=base /app/backend/package.json /app/backend/tsconfig.json backend/
COPY --from=base /app/backend/dist backend/dist
COPY --from=base /app/backend/migrations backend/migrations
COPY --from=base /app/node_modules node_modules
COPY --from=base /app/backend/node_modules backend/node_modules

EXPOSE 4400
WORKDIR /app/backend
USER node
CMD ["node", "dist/server.js"]
