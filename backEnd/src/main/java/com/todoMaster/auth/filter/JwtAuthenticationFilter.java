package com.todoMaster.auth.filter;

import com.todoMaster.auth.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 요청의 Authorization 헤더에서 Bearer 토큰을 추출하여 검증하고,
 * 인증이 유효하면 SecurityContext에 Authentication을 설정한다.
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. HTTP 요청 헤더에서 "Authorization" 값을 가져옵니다.
        String header = request.getHeader("Authorization");

        // 2. Authorization 헤더가 존재하고, "Bearer "로 시작하는지 확인하여 JWT 토큰을 추출합니다.
        if (header != null && header.startsWith("Bearer ")) {
            // "Bearer " (7글자) 이후의 문자열이 실제 JWT 토큰입니다.
            String token = header.substring(7);

            // 3. 추출한 JWT 토큰의 유효성을 검증합니다 (만료 여부, 서명 유효성 등).
            if (jwtProvider.validateToken(token)) {
                
                // 4. 토큰이 유효하면, 토큰에서 사용자 고유 ID(Subject)를 추출합니다.
                Long userId = jwtProvider.getUserId(token);
                
                // 5. Spring Security의 인증 객체(Authentication)를 생성합니다.
                //    - principal: 사용자 ID (인증 주체)
                //    - credentials: 비밀번호 (JWT 인증에서는 null)
                //    - authorities: 권한 목록 (현재는 비어있는 목록)
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userId, 
                    null, 
                    java.util.Collections.emptyList() // 단순 인증 토큰 (권한은 추후 확장 가능)
                );
                
                // 6. 현재 Security Context에 인증 객체를 설정합니다.
                //    이후 Security Context에 저장된 인증 정보(userId)를 기반으로 접근 제어 및 사용자 정보 조회가 가능해집니다.
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        
        // 7. 다음 필터로 요청과 응답을 전달하여 필터 체인을 계속 진행합니다.
        filterChain.doFilter(request, response);
    }
}
