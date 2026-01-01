package com.todoMaster.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 로그인 응답 (Access Token 전달용). Refresh는 쿠키로 내려보냄.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
	// 토큰
    private String accessToken;
    
    /**
     * 로그인 제공자 (예: standard, kakao, google)
     */
    private String provider;
}
