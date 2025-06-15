FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG NODE_ENV=production
ARG INSTANCE
ARG NEXT_PUBLIC_API_URL

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV INSTANCE=$INSTANCE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Debug: Log build args (will be removed before shipping)
RUN echo "Build args - NODE_ENV: $NODE_ENV, INSTANCE: $INSTANCE, NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
