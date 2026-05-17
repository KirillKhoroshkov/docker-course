FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set npm configuration for faster installs
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retries 3
RUN npm config set fetch-timeout 30000

# Create app directory
WORKDIR /usr/src/app

# Add package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy app source
COPY src/ ./src/

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "src/server.js"]
