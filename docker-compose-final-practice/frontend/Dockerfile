# Build stage
FROM node:18-alpine AS builder

# Set npm configuration to speed up installs
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retries 5
RUN npm config set fetch-timeout 60000

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install with optimizations
RUN npm install --no-audit --no-fund --prefer-offline

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
