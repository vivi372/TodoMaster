package com.todoMaster.auth.controller;

import com.todoMaster.auth.dto.request.AccountActivationRequest;
import com.todoMaster.auth.dto.request.LoginRequest;
import com.todoMaster.auth.dto.request.PasswordCheckRequest;
import com.todoMaster.auth.dto.request.ResendRequest;
import com.todoMaster.auth.dto.request.SocialLoginRequest;
import com.todoMaster.auth.dto.request.SocialSignupRequest;
import com.todoMaster.auth.dto.request.UserSignupRequest;
import com.todoMaster.auth.dto.response.LoginResponse;
import com.todoMaster.auth.dto.response.SocialLoginResponse;
import com.todoMaster.auth.service.AuthService;
import com.todoMaster.global.dto.ApiResponse;

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
    public ResponseEntity<?> signup(@RequestBody @Valid UserSignupRequest req) {
    	authService.signup(req);    	
    	
        return ResponseEntity.ok(ApiResponse.success("회원가입 완료"));
    }
    
    // 인증 이메일 재전송
    @PostMapping("/rseend")
    public ResponseEntity<?> rseend(@RequestBody @Valid ResendRequest req) {
    	authService.rseend(req.getEmail());    	
    	
        return ResponseEntity.ok(ApiResponse.success("이메일 재전송 완료"));
    }
    
    // 계정 활성화
    @PostMapping("/verify")
    public ResponseEntity<?> accountActivation(@RequestBody @Valid AccountActivationRequest req) {
    	authService.accountActivation(req.getToken());    	
    	
        return ResponseEntity.ok(ApiResponse.success("회원가입 완료"));
    }
    
    // -------- 소셜 회원가입 --------
    @PostMapping("/social/signup")
    public ResponseEntity<?> socialSignup(
            @Valid @RequestBody SocialSignupRequest req
    ) {
        Long userId = authService.socialSignup(req.getProvider(), req.getCode());
        return ResponseEntity.ok(ApiResponse.success("소셜 회원가입 성공", userId));
    }

    /**
     * 로그인 엔드포인트
     * - body에 email/password/rememberMe를 JSON으로 전달
     * - 응답 본문에는 access token, refresh는 HttpOnly 쿠키로 설정
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
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
        
        ApiResponse<LoginResponse> response = ApiResponse.success(
        		"로그인 성공"
        		, new LoginResponse(access)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }
    
    
    @PostMapping("/social/login")
    public ResponseEntity<?> socialLogin(@Valid @RequestBody SocialLoginRequest req) {

        String combined = authService.socialLogin(req.getProvider(), req.getCode());
        String[] parts = combined.split("::", 2);

        String access = parts[0];
        String refresh = parts[1];

        // RefreshToken → HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refresh)
                .httpOnly(true)
                .secure(false) // 운영환경에서는 true
                .path("/api/auth/refresh")
                .maxAge(14 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        ApiResponse<SocialLoginResponse> response = ApiResponse.success(
                "소셜 로그인 성공",
                new SocialLoginResponse(access)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    /**
     * 리프레시 토큰으로 액세스 토큰 재발급
     * - 프론트는 쿠키를 자동으로 전송(axios withCredentials:true)
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
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
        
        ApiResponse<LoginResponse> response = ApiResponse.success(
        		"토큰 갱신 성공"
        		, new LoginResponse(access)
        );

        return ResponseEntity.ok()
        		.header(HttpHeaders.SET_COOKIE, cookie.toString())
        		.body(response);
    }

    /**
     * 로그아웃
     * - access token에서 userId 추출 후 DB에 저장된 refresh 토큰을 삭제
     * - 쿠키 삭제
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(name = "Authorization", required = false) String authHeader,
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

        return ResponseEntity.ok()
        		.header(HttpHeaders.SET_COOKIE, cookie.toString())
        		.body(ApiResponse.success("로그아웃 성공"));
    }
    
    /**
     * 비밀번호 초기화 나중에 이메일을 통해 임시 비밀번호 지급
     * @param email
     * @return 임시 비밀번호
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(String email) {
        String tempPassword = authService.resetPassword(email);
        
        ApiResponse<String> response = ApiResponse.success(
        		"임시 비밀번호 발급 완료"
        		, tempPassword
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 비밀번호 검증 api
     * @param request
     * @return
     */
    @PostMapping("/check-password")
    public ResponseEntity<?> checkPassword(
    		@RequestHeader(name = "Authorization", required = false) String authHeader,
    		@Valid @RequestBody PasswordCheckRequest request) {
    	
    	// 헤더 인증부에 있는 토큰을 통해 userId 가져오기
    	if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Invalid Authorization header");
        }
        String access = authHeader.substring(7);
        Long userId = authService.getUserIdFromAccessToken(access);

        authService.checkPassword(userId, request.getPassword());

        return ResponseEntity.ok(ApiResponse.success("비밀번호 확인 완료"));
    }

}
