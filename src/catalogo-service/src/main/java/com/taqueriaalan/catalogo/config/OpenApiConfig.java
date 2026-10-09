package com.taqueriaalan.catalogo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI catalogoOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Catalogo Service API")
                        .description("Gestion de categorias y productos del catalogo")
                        .version("v1"));
    }
}
