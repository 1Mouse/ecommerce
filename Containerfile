FROM docker.io/library/node:24-slim

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY src ./src

USER node

EXPOSE 3000

CMD ["node", "src/server.ts"]
