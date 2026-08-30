# Base image with Node.js LTS
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built artifacts and package manifest
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
