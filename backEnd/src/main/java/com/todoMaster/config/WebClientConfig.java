package com.todoMaster.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // WebClient 빈을 등록
    @Bean
    public WebClient webClient() {
        // 프로젝트 전체에서 사용할 기본 WebClient를 생성합니다.
        return WebClient.builder()
                        // .baseUrl("https://api.example.com") // 필요 시 기본 URL 설정 가능
                        .build(); 
    }
}
