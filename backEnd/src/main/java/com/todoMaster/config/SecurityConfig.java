package com.todoMaster.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
	 @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .csrf(cs -> cs.disable())
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // ★ 모든 요청 허용
            )
            .formLogin(f -> f.disable()) // ★ 기본 로그인 폼 비활성화
            .httpBasic(h -> h.disable()); // ★ 기본 인증 비활성화

        return http.build();
    }
}
