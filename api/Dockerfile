FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace descriptors
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY api/package.json ./api/
COPY sdk/package.json ./sdk/
COPY pipeline/package.json ./pipeline/
COPY demo/sandbox-career/package.json ./demo/sandbox-career/
COPY demo/sandbox-player/package.json ./demo/sandbox-player/
COPY module/package.json ./module/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source & contracts
COPY api ./api
COPY contracts ./contracts
COPY docs ./docs

WORKDIR /app/api
RUN pnpm db:generate
RUN pnpm typecheck

ENV PORT=4010
ENV NODE_ENV=production
ENV STORE=prisma

EXPOSE 4010

CMD ["pnpm", "start"]
