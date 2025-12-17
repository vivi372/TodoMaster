package com.todoMaster.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

 @Override
 public void addCorsMappings(CorsRegistry registry) {
     registry.addMapping("/**") // 모든 API 경로에 대해
             .allowedOrigins("http://localhost:5173") // 🟢 허용할 오리진 명시
             .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 허용할 HTTP 메서드
             .allowedHeaders("*") // 모든 헤더 허용
             .allowCredentials(true) // 클라이언트의 쿠키, 인증 헤더 전송 허용
             .maxAge(3600); // Preflight 요청 캐시 유지 시간 (초)
 }
}
