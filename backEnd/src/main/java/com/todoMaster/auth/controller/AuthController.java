package com.todoMaster.auth.controller;

import com.todoMaster.auth.dto.LoginRequest;
import com.todoMaster.auth.dto.LoginResponse;
import com.todoMaster.auth.dto.UserSignupRequest;
import com.todoMaster.auth.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;

@RestController
@Slf4j
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    
    @PostMapping("/signup")
    public String signup(@RequestBody @Valid UserSignupRequest req) {
    	authService.signup(req);
        return "SUCCESS";
    }

    /**
     * 로그인 엔드포인트
     * - body에 email/password/rememberMe를 JSON으로 전달
     * - 응답 본문에는 access token, refresh는 HttpOnly 쿠키로 설정
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        String combined = authService.login(req); // "access::refresh"
        String[] parts = combined.split("::", 2);
        String access = parts[0];
        String refresh = parts[1];
        
        log.info(combined);

        // HttpOnly, SameSite 설정된 쿠키로 refresh 토큰 전달
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refresh)
                .httpOnly(true)
                .secure(false) // 운영환경(https)에서는 true로 설정
                .path("/api/auth/refresh")
                .maxAge(14 * 24 * 60 * 60) // 14일
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(access));
    }

    /**
     * 리프레시 토큰으로 액세스 토큰 재발급
     * - 프론트는 쿠키를 자동으로 전송(axios withCredentials:true)
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) throw new IllegalArgumentException("리프레시 토큰이 없습니다.");
        
        log.info(refreshToken);
        
        String combined = authService.refresh(refreshToken);
        String[] parts = combined.split("::", 2);
        String access = parts[0];
        String newRefresh = parts[1];

        ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefresh)
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .maxAge(14 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(new LoginResponse(access));
    }

    /**
     * 로그아웃
     * - access token에서 userId 추출 후 DB에 저장된 refresh 토큰을 삭제
     * - 쿠키 삭제
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader(name = "Authorization", required = false) String authHeader,
                                         @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Invalid Authorization header");
        }
        String access = authHeader.substring(7);
        Long userId = authService.getUserIdFromAccessToken(access);

        // DB의 refresh token 삭제
        authService.logout(userId);

        // 쿠키 삭제
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body("logout");
    }
}
