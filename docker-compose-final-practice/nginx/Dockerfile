FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Use existing nginx user from base image

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx

# Create custom error pages directory
RUN mkdir -p /usr/share/nginx/html/errors

# Add custom error pages
RUN echo '<html><body><h1>🚀 Galactic Pizza - Service Temporarily Unavailable</h1><p>Our hyperspace communication is down. Please try again.</p></body></html>' > /usr/share/nginx/html/errors/50x.html
RUN echo '<html><body><h1>🍕 Galactic Pizza - Page Not Found</h1><p>This endpoint does not exist in our galactic database.</p></body></html>' > /usr/share/nginx/html/errors/404.html

# Expose port
EXPOSE 80

# Use nginx user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
