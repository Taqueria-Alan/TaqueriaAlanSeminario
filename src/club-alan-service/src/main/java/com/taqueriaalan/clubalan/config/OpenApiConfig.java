package com.taqueriaalan.clubalan.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI clubAlanOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Club Alan Service API")
                        .description("Gestion del programa de lealtad Club Alan: puntos y membresias")
                        .version("v1"));
    }
}
