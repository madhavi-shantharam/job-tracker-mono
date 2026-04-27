# ── Stage 1: Build ────────────────────────────────────────────────────────
# Use Maven + Java 21 to compile and package the app
# We use Java 21 (LTS) for the build — compatible with Spring Boot 4
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy dependency descriptors first — Docker caches this layer
# so dependencies only re-download when pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source code and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────
# Use a slim Java 21 runtime — no Maven, no source code, much smaller image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user — security best practice
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the built JAR from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown appuser:appgroup app.jar
USER appuser

# Expose the port Spring Boot listens on
EXPOSE 8080

# Health check — ECS uses this to know if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Start the app
ENTRYPOINT ["java", "-jar", "app.jar"]