FROM node:22-alpine

# Set timezone to Chicago (GTFS data is in Chicago local time)
RUN apk add --no-cache tzdata
ENV TZ=America/Chicago

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

# Bundle the backend (with shared inlined) into one plain-JS file.
# Output must stay two levels below packages/backend: gtfsService locates
# /app/schedule relative to its own file location.
RUN pnpm --filter @chicagorail/backend bundle

# Expose port
ENV PORT=5000
EXPOSE 5000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Run node directly: one process, no pnpm/tsx wrappers or runtime compilation
CMD ["node", "--enable-source-maps", "packages/backend/dist/server/index.js"]
