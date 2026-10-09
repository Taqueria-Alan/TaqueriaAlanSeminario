package com.taqueriaalan.pagos.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI pagosOpenApi() {
        return new OpenAPI().info(new Info().title("Pagos Service API")
                .description("Simulador seguro de pagos para el prototipo académico")
                .version("v1"));
    }
}
