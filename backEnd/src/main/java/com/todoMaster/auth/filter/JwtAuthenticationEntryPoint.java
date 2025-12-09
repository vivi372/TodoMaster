package com.todoMaster.auth.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 인증 실패(권한 없음 등)시 동작하는 엔트리 포인트.
 * Security 레벨에서 발생하는 인증 예외를 JSON 형식으로 응답.
 */
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    // Java 객체를 JSON 문자열로 변환(직렬화)하는 데 사용되는 ObjectMapper 인스턴스
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 인증되지 않은 사용자가 보호된 리소스에 접근을 시도할 때 호출됩니다.
     * * @param request 클라이언트 요청
     * @param response 서버 응답
     * @param authException 발생한 인증 관련 예외 (토큰 누락, 토큰 형식 오류 등)
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        // 1. HTTP 응답 상태 코드를 401 Unauthorized로 설정
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        
        // 2. 응답 본문(Body)의 Content-Type을 JSON으로 설정
        response.setContentType("application/json;charset=UTF-8");

        // 3. 응답에 포함될 JSON 본문(Body) 데이터를 구성합니다.
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.UNAUTHORIZED.value()); // 401
        body.put("errorCode", "INVALID_TOKEN"); // 사용자 정의 에러 코드
        body.put("message", "인증 정보가 필요하거나 유효하지 않습니다."); // 사용자에게 보여줄 메시지

        // 4. ObjectMapper를 사용하여 Map 객체를 JSON 문자열로 변환하고 응답 스트림에 기록합니다.
        objectMapper.writeValue(response.getWriter(), body);
    }
}
