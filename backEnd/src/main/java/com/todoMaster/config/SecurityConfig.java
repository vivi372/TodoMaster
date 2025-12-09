package com.todoMaster.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

import com.todoMaster.auth.filter.JwtAuthenticationFilter;
import com.todoMaster.auth.util.JwtProvider;

import lombok.RequiredArgsConstructor;

/**
 * Security 설정:
 * - /api/auth/** 는 모두 permitAll
 * - 그 외 요청은 인증 필요
 * - JwtAuthenticationFilter를 UsernamePasswordAuthenticationFilter 앞에 추가
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	// JWT 관련 로직을 처리하는 유틸리티 클래스 (생성자 주입)
    private final JwtProvider jwtProvider;

    /**
     * Security Filter Chain을 정의하는 Bean입니다.
     * HTTP 요청에 대한 보안 규칙과 필터 순서를 설정합니다.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 1. JWT Provider를 사용하여 사용자 정의 JWT 인증 필터 인스턴스를 생성합니다.
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtProvider);

        // 2. HTTP 보안 설정을 구성합니다.
        http
            // 2-1. CSRF (Cross-Site Request Forgery) 보호 기능을 비활성화합니다.
            // REST API 서버에서는 세션을 사용하지 않으므로 CSRF가 필요하지 않습니다.
            .csrf(cs -> cs.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
         
            // 2-2. HTTP 요청에 대한 인가(Authorization) 규칙을 설정합니다.
            .authorizeHttpRequests(auth -> auth
                // '/api/auth/'로 시작하는 모든 요청 (로그인, 토큰 갱신 등)은 인증 없이 허용합니다.
                .requestMatchers("/api/auth/**").permitAll()
                // 그 외 나머지 모든 요청은 반드시 인증(Authentication)이 필요합니다.
                .anyRequest().authenticated()
            )
            
            // 2-3. 커스텀 JWT 필터를 등록합니다.
            // UsernamePasswordAuthenticationFilter(기본 폼 로그인 처리 필터) 이전에 실행되도록 설정하여,
            // 매 요청마다 JWT를 검증하고 인증 정보를 Security Context에 설정합니다.
            .addFilterBefore(jwtFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            
            // 2-4. HTTP Basic 인증 메커니즘을 비활성화합니다. (JWT 방식 사용)
            .httpBasic(b -> b.disable())
            
            // 2-5. 기본 Form Login 메커니즘을 비활성화합니다. (JWT 방식 사용)
            .formLogin(f -> f.disable());

        // 3. 설정된 내용으로 SecurityFilterChain을 빌드하고 반환합니다.
        return http.build();
    }
    
    // 참고: JWT 기반 인증에서는 세션을 사용하지 않으므로 sessionManagement 설정을 추가하는 것이 일반적입니다.
    /*
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    */
}
