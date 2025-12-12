package com.todoMaster.auth.oauth;

import com.todoMaster.auth.dto.response.KakaoTokenResponse;
import com.todoMaster.auth.dto.response.KakaoUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Kakao OAuth 2.0 서버와 통신하는 전용 클라이언트입니다.
 * 비동기 통신을 위한 WebClient를 사용하며,
 * 인가 코드(Code)를 토큰으로 교환하고, 토큰으로 사용자 정보를 조회하는 역할을 합니다.
 */
@Component
@RequiredArgsConstructor
public class KakaoOAuthClient {

    // application.yml/properties에서 주입받는 카카오 애플리케이션 정보
    @Value("${oauth.kakao.client-id}")
    private String clientId;
    
    @Value("${oauth.kakao.client-secret}")
    private String clientSecret;

    @Value("${oauth.kakao.redirect-uri}")
    private String redirectUri;
    
    // WebClient 인스턴스 (HTTP 통신을 위한 비동기 클라이언트)
    private final WebClient webClient = WebClient.builder().build(); 
    // 참고: WebClient를 Bean으로 등록하고 주입받아 사용하는 것이 더 일반적입니다.

    /** * 인가코드(code) → access_token 발급
     * Kakao 토큰 엔드포인트에 인가 코드를 전송하여 Access Token을 발급받습니다.
     * * @param code 클라이언트로부터 전달받은 인가 코드 (Authorization Code)
     * @return KakaoTokenResponse DTO (Access Token 정보를 담고 있음)
     */
    public KakaoTokenResponse getToken(String code) {
        return webClient.post()
                // 1. 토큰 발급 요청 URI 구성 (https://kauth.kakao.com/oauth/token)
        		.uri("https://kauth.kakao.com/oauth/token")
        		.headers(headers -> {
                    headers.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
                })
                .bodyValue(
                        "grant_type=authorization_code" +
                        "&client_id=" + clientId +
                        "&client_secret=" + clientSecret +
                        "&redirect_uri=" + redirectUri +
                        "&code=" + code
                )
                .retrieve() // 응답 본문 추출을 시작
                .bodyToMono(KakaoTokenResponse.class) // 응답 본문을 Mono<KakaoTokenResponse>로 변환
                .block(); // 블로킹 방식으로 실행하고 결과를 즉시 반환 (주의: 논블로킹 환경에서는 권장되지 않음)
    }

    /** * access_token → 사용자 정보 조회
     * 발급받은 Access Token을 사용하여 카카오 사용자 정보 엔드포인트에 접근합니다.
     * * @param accessToken 카카오로부터 발급받은 Access Token
     * @return KakaoUserResponse DTO (카카오 사용자 상세 정보)
     */
    public KakaoUserResponse getUserInfo(String accessToken) {
        return webClient.get()
                .uri("https://kapi.kakao.com/v2/user/me") // 카카오 사용자 정보 조회 API URL
                // Authorization 헤더에 Bearer 토큰을 설정합니다.
                .header("Authorization", "Bearer " + accessToken)
                .retrieve() // 응답 본문 추출을 시작
                .bodyToMono(KakaoUserResponse.class) // 응답 본문을 Mono<KakaoUserResponse>로 변환
                .block(); // 블로킹 방식으로 실행하고 결과를 즉시 반환
    }
}