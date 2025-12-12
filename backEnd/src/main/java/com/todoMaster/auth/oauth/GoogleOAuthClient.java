package com.todoMaster.auth.oauth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.todoMaster.auth.dto.SocialUserInfo;
import com.todoMaster.auth.dto.response.GoogleTokenResponse;
import com.todoMaster.auth.dto.response.GoogleUserResponse;

/**
 * Google OAuth 2.0 서버와 통신하는 전용 클라이언트 컴포넌트입니다.
 * 비동기 WebClient를 사용하여 인가 코드 교환 및 사용자 정보 조회를 수행합니다.
 * 이 클라이언트는 백엔드에서 Google 토큰을 발급받는 Authorization Code Grant 플로우를 따릅니다.
 */
@Component
@RequiredArgsConstructor
public class GoogleOAuthClient {

    // Spring WebFlux에 포함된 논블로킹 HTTP 클라이언트 (Bean으로 주입받음)
    private final WebClient webClient;

    // application.yml/properties에서 주입받는 Google 애플리케이션 정보
    @Value("${oauth.google.client-id}")
    private String clientId;

    @Value("${oauth.google.client-secret}")
    private String clientSecret;

    @Value("${oauth.google.redirect-uri}")
    private String redirectUri;

    /**
     * 인가코드(code) → access_token → 사용자 정보 조회
     * Google의 토큰 엔드포인트에 인가 코드와 Client Secret을 전송하여 Access Token을 발급받습니다.
     * 그 후 발급받은 Access Token을 사용하여 Google 사용자 정보 엔드포인트에 접근합니다.
     * @param code 클라이언트로부터 전달받은 인가 코드 (Authorization Code)
     * @return SocialUserInfo (Google 사용자 상세 정보)
     */
    public SocialUserInfo getUserInfoByCode(String code) {

        // 1) 인증코드 → AccessToken 교환
    	GoogleTokenResponse token = webClient.post()
                .uri("https://oauth2.googleapis.com/token") // Google 토큰 발급 API URL
                .headers(headers ->
                        // Content-Type을 x-www-form-urlencoded로 명시 (Google API 요구 사항)
                        headers.set("Content-Type", "application/x-www-form-urlencoded")
                )
                // 2. 요청 본문(Body)에 파라미터를 URL 인코딩 문자열 형태로 구성
                .bodyValue(
                        "grant_type=authorization_code" +
                        "&client_id=" + clientId +
                        "&client_secret=" + clientSecret +
                        "&redirect_uri=" + redirectUri +
                        "&code=" + code
                )
                .retrieve()
                .bodyToMono(GoogleTokenResponse.class) // 응답을 DTO로 변환
                .block(); // 블로킹 방식으로 실행하고 결과를 즉시 반환
    	
    	// 2) AccessToken → UserInfo 조회
    	GoogleUserResponse user = webClient.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo") // Google 사용자 정보 조회 API URL
                // 2. Authorization 헤더에 Bearer 토큰을 설정
                .header("Authorization", "Bearer " + token.getAccessToken())
                .retrieve()
                .bodyToMono(GoogleUserResponse.class) // 응답을 DTO로 변환
                .block(); // 블로킹 방식으로 실행하고 결과를 즉시 반환
    	
    	// 3) 내 서비스에서 사용하는 표준 DTO로 변환
        return SocialUserInfo.fromGoogle(user);
    }
    
}