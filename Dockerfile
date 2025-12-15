FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/
COPY schedule/ ./schedule/

# Build
RUN pnpm --filter @chicagorail/shared build && pnpm --filter @chicagorail/backend build

# Verify build output
RUN ls -la packages/backend/dist/src/

# Expose port
ENV PORT=5000
EXPOSE 5000

# Start the server
CMD ["node", "packages/backend/dist/src/index.js"]
