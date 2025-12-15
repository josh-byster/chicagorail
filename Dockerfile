FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies (including dev for tsx)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/
COPY schedule/ ./schedule/

# Build shared package
RUN pnpm --filter @chicagorail/shared build

# Expose port
ENV PORT=5000
EXPOSE 5000

# Start the server using tsx (handles ESM properly)
CMD ["pnpm", "--filter", "@chicagorail/backend", "start"]
