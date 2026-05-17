package com.galacticpizza.orderservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.io.File;
import java.nio.file.Files;
import java.time.Duration;

/**
 * Redis Configuration for Galactic Pizza Order Service
 * 
 * Configures Redis connection, serialization, and connection pooling
 * for optimal performance in the galactic environment.
 */
@Configuration
public class RedisConfig {

    private static final Logger logger = LoggerFactory.getLogger(RedisConfig.class);

    @Value("${spring.data.redis.host:redis-cache}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.password-file:/run/secrets/redis_password}")
    private String redisPasswordFile;

    @Value("${spring.data.redis.timeout:10s}")
    private Duration redisTimeout;

    @Value("${spring.data.redis.database:0}")
    private int redisDatabase;

    /**
     * Redis Connection Factory Configuration
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        logger.info("🔧 Configuring Redis connection to {}:{}", redisHost, redisPort);

        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
        redisConfig.setHostName(redisHost);
        redisConfig.setPort(redisPort);
        redisConfig.setDatabase(redisDatabase);

        // Set password from file or environment variable
        String password = getRedisPassword();
        if (password != null && !password.trim().isEmpty()) {
            redisConfig.setPassword(password);
            logger.info("🔐 Redis password configured from secrets");
        } else {
            logger.warn("⚠️ No Redis password configured - using unsecured connection");
        }

        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .commandTimeout(redisTimeout)
                .shutdownTimeout(Duration.ZERO)
                .build();

        LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(redisConfig, clientConfig);
        connectionFactory.afterPropertiesSet();

        logger.info("✅ Redis connection factory configured successfully");
        return connectionFactory;
    }

    /**
     * Redis Template Configuration
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        logger.info("🔧 Configuring Redis template for galactic data operations");

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Configure serializers
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        // Set key serializer
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // Set value serializers
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        // Set default serializer
        template.setDefaultSerializer(jsonSerializer);

        // Enable transaction support
        template.setEnableTransactionSupport(true);

        // Initialize template
        template.afterPropertiesSet();

        logger.info("✅ Redis template configured with JSON serialization");
        return template;
    }

    /**
     * Get Redis password from secrets file or environment variable
     */
    private String getRedisPassword() {
        try {
            // First, try to read from secrets file (Docker secrets)
            if (redisPasswordFile != null && !redisPasswordFile.trim().isEmpty()) {
                File passwordFile = new File(redisPasswordFile);
                if (passwordFile.exists() && passwordFile.canRead()) {
                    String password = Files.readString(passwordFile.toPath()).trim();
                    if (!password.isEmpty()) {
                        logger.info("🔐 Redis password loaded from secrets file: {}", redisPasswordFile);
                        return password;
                    }
                }
            }

            // Fall back to environment variable or application property
            if (redisPassword != null && !redisPassword.trim().isEmpty()) {
                logger.info("🔐 Redis password loaded from configuration");
                return redisPassword.trim();
            }

            // Check common environment variables
            String envPassword = System.getenv("REDIS_PASSWORD");
            if (envPassword != null && !envPassword.trim().isEmpty()) {
                logger.info("🔐 Redis password loaded from environment variable");
                return envPassword.trim();
            }

            logger.info("ℹ️ No Redis password configured");
            return null;

        } catch (Exception e) {
            logger.error("💥 Failed to load Redis password: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Redis health check bean
     */
    @Bean
    public RedisHealthIndicator redisHealthIndicator(RedisTemplate<String, Object> redisTemplate) {
        return new RedisHealthIndicator(redisTemplate);
    }

    /**
     * Custom Redis Health Indicator
     */
    public static class RedisHealthIndicator {
        private static final Logger logger = LoggerFactory.getLogger(RedisHealthIndicator.class);
        
        private final RedisTemplate<String, Object> redisTemplate;

        public RedisHealthIndicator(RedisTemplate<String, Object> redisTemplate) {
            this.redisTemplate = redisTemplate;
        }

        public boolean isHealthy() {
            try {
                // Test Redis connection with a simple ping
                redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<String>) connection -> {
                    connection.ping();
                    return "PONG";
                });

                // Test basic operations
                String testKey = "galactic:health:check";
                redisTemplate.opsForValue().set(testKey, "healthy", 1, java.util.concurrent.TimeUnit.MINUTES);
                String result = (String) redisTemplate.opsForValue().get(testKey);
                
                boolean isHealthy = "healthy".equals(result);
                
                if (isHealthy) {
                    logger.debug("✅ Redis health check passed");
                    // Clean up test key
                    redisTemplate.delete(testKey);
                } else {
                    logger.warn("⚠️ Redis health check failed - unexpected result: {}", result);
                }
                
                return isHealthy;

            } catch (Exception e) {
                logger.error("💥 Redis health check failed: {}", e.getMessage(), e);
                return false;
            }
        }

        public String getConnectionInfo() {
            try {
                return redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<String>) connection -> {
                    return "Connected to Redis - DB: " + connection.getConfig("databases");
                });
            } catch (Exception e) {
                return "Redis connection info unavailable: " + e.getMessage();
            }
        }
    }
}
