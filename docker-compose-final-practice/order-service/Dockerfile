FROM eclipse-temurin:17-jdk-jammy

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Maven files
COPY pom.xml ./
COPY src ./src

# Install Maven
RUN apt-get update && apt-get install -y maven

# Cache dependencies
RUN mvn dependency:go-offline

# Build application
RUN mvn clean package -DskipTests

# Create non-root user
RUN groupadd -r spring && useradd -r -g spring spring
RUN chown -R spring:spring /app
USER spring

# Expose port
EXPOSE 8001

# Run the application
CMD ["java", "-jar", "-Dserver.port=8001", "target/order-service-1.0.0.jar"]
