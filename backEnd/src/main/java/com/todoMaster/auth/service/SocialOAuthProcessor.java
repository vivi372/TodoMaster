package com.todoMaster.auth.service;

import com.todoMaster.auth.dto.SocialUserInfo;
import com.todoMaster.auth.dto.response.GoogleTokenResponse;
import com.todoMaster.auth.dto.response.GoogleUserResponse;
import com.todoMaster.auth.dto.response.KakaoTokenResponse;
import com.todoMaster.auth.dto.response.KakaoUserResponse;
import com.todoMaster.auth.oauth.GoogleOAuthClient;
import com.todoMaster.auth.oauth.KakaoOAuthClient;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

/**
 * 소셜 로그인(OAuth)의 비즈니스 로직을 처리하는 서비스 클래스입니다.
 * 클라이언트로부터 받은 '인가 코드'를 사용하여 백엔드에서 직접 토큰을 발급받고,
 * 사용자 정보를 조회하여 애플리케이션의 통합 DTO로 변환하는 역할을 수행합니다.
 */
@Component
@RequiredArgsConstructor
public class SocialOAuthProcessor {

    // Kakao 소셜 로그인 API와 통신하는 클라이언트 객체 주입
    private final KakaoOAuthClient kakaoClient;
    // Google 소셜 로그인 API와 통신하는 클라이언트 객체 주입
    private final GoogleOAuthClient googleClient;

    /**
     * 특정 소셜 제공자(Provider)로부터 인가 코드를 사용하여 사용자 정보를 획득합니다.
     * 이 메서드는 Authorization Code Grant 플로우의 서버 측 로직을 구현합니다.
     *
     * @param provider 소셜 제공자 이름 (예: "kakao")
     * @param code 클라이언트로부터 받은 인가 코드 (Authorization Code)
     * @return 표준화된 SocialUserInfo DTO
     * @throws CustomException 지원하지 않는 제공자가 입력된 경우
     */
	public SocialUserInfo getUserFromProvider(String provider, String code) {

		// provider 종류에 따라 분기하여 처리합니다. (Java 14+ switch expression 사용)
		return switch (provider.toLowerCase()) {

		// 1. 카카오 로그인 처리
		case "kakao" -> kakaoClient.getUserInfoByCode(code);
		// 1. 카카오 로그인 처리
		case "google" -> googleClient.getUserInfoByCode(code);

		// 지원하지 않는 provider가 들어온 경우 예외 처리
		default -> throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
		};
	}
}