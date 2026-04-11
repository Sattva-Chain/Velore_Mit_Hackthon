package com.navmate.common;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI navMateOpenApi() {
        return new OpenAPI().info(new Info()
                .title("NavMate Live API")
                .description("Indoor navigation MVP APIs for mobile and admin workflows")
                .version("v1"));
    }
}
