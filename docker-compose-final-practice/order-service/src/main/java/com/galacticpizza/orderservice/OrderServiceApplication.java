package com.galacticpizza.orderservice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Value;

/**
 * Galactic Pizza Order Service
 * 
 * A Spring Boot microservice responsible for handling intergalactic pizza orders,
 * managing order lifecycle, and coordinating with other galactic services.
 * 
 * Features:
 * - Order creation and management
 * - Redis caching for order data
 * - Inter-service communication with Menu Service
 * - Hyperspace delivery tracking
 * - Galactic address validation
 */
@SpringBootApplication
public class OrderServiceApplication {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceApplication.class);

    @Value("${app.menu-service.url:http://menu-service:8000}")
    private String menuServiceUrl;

    @Value("${server.port:8001}")
    private String serverPort;

    /**
     * Main application entry point
     */
    public static void main(String[] args) {
        // Set system properties for better logging and performance
        System.setProperty("spring.output.ansi.enabled", "always");
        System.setProperty("logging.pattern.console", 
            "%clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} %clr(%5p) %clr(${PID:- }){magenta} %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} %clr(:){faint} %m%n%wEx");
        
        try {
            SpringApplication application = new SpringApplication(OrderServiceApplication.class);
            
            // Configure application properties
            application.setAdditionalProfiles("galactic");
            
            logger.info("🚀 Launching Galactic Pizza Order Service...");
            logger.info("⭐ Initializing hyperspace communication protocols...");
            
            application.run(args);
            
        } catch (Exception e) {
            logger.error("❌ Failed to launch Order Service: {}", e.getMessage(), e);
            System.exit(1);
        }
    }

    /**
     * WebClient bean for inter-service communication
     */
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(16 * 1024 * 1024)) // 16MB buffer
                .build();
    }

    /**
     * Application startup event handler
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        logger.info("🍕 Galactic Pizza Order Service is ready!");
        logger.info("🌌 Service running on port: {}", serverPort);
        logger.info("🔗 Menu Service URL: {}", menuServiceUrl);
        logger.info("📡 Health endpoint: http://localhost:{}/actuator/health", serverPort);
        logger.info("🛸 Ready to receive orders from across the galaxy!");
        
        // Log service capabilities
        logger.info("🌟 Service Capabilities:");
        logger.info("   • Order Creation & Management");
        logger.info("   • Hyperspace Delivery Tracking"); 
        logger.info("   • Redis Caching & Data Persistence");
        logger.info("   • Inter-Galactic Address Validation");
        logger.info("   • Menu Service Integration");
        logger.info("   • Real-time Order Status Updates");
        
        // Print ASCII art for fun
        printGalacticLogo();
    }

    /**
     * Print ASCII art logo for the service
     */
    private void printGalacticLogo() {
        logger.info("\n" +
            "  ╔═══════════════════════════════════════╗\n" +
            "  ║        🍕 GALACTIC PIZZA 🚀           ║\n" +
            "  ║           ORDER SERVICE               ║\n" +
            "  ║                                       ║\n" +
            "  ║    Delivering across the universe     ║\n" +
            "  ║         since stardate 2387           ║\n" +
            "  ╚═══════════════════════════════════════╝\n");
    }
}
