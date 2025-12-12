package com.todoMaster.auth.dto;

import com.todoMaster.auth.dto.response.GoogleUserResponse;
import com.todoMaster.auth.dto.response.KakaoUserResponse;

import lombok.*;

/**
 * 애플리케이션 내부에서 사용하는 소셜 사용자 정보 통합 DTO (Data Transfer Object)입니다.
 * 카카오, 구글, 네이버 등 여러 소셜 서비스의 응답 형식을 하나의 표준화된 객체로 변환하여 사용합니다.
 */
@Getter
@Builder
public class SocialUserInfo {

    // 소셜 제공자 이름 (예: "kakao", "google", "naver")
    private String provider;

    // 소셜 제공자 내에서 사용자를 식별하는 고유 ID
    private String providerId;

    // 사용자 이메일 주소
    private String email;

    // 사용자 닉네임
    private String nickname;

    // 사용자 프로필 이미지 URL
    private String profileImage;

    // --- 정적 팩토리 메서드 (Static Factory Methods) ---

    /**
     * Kakao 사용자 정보 응답 객체(KakaoUserResponse)를 SocialUserInfo DTO로 변환합니다.
     * @param response 카카오 응답에서 추출된 사용자 계정 정보
     * @return 표준화된 SocialUserInfo 객체
     */
    public static SocialUserInfo fromKakao(KakaoUserResponse response) {
        // Kakao의 필드 이름에 맞춰 데이터를 추출하고 provider를 "kakao"로 설정
        return SocialUserInfo.builder()
                .provider("kakao")
                .providerId(String.valueOf(response.getId()))
                .email(response.getKakaoAccount().getEmail())
                .nickname(response.getKakaoAccount().getProfile().getNickname())
                .profileImage(response.getKakaoAccount().getProfile().getProfileImageUrl())
                .build();
    }

    /**
     * Google 사용자 정보 응답 객체(GoogleUserResponse)를 SocialUserInfo DTO로 변환합니다.
     * @param res 구글 사용자 정보 응답 객체
     * @return 표준화된 SocialUserInfo 객체
     */
    public static SocialUserInfo fromGoogle(GoogleUserResponse res) {
        // Google의 필드 이름에 맞춰 데이터를 추출하고 provider를 "google"로 설정
        return SocialUserInfo.builder()
                .provider("google")
                .providerId(res.getSub()) // Google에서 고유 ID를 나타내는 필드
                .email(res.getEmail())
                .nickname(res.getName())
                .profileImage(res.getPicture())
                .build();
    }

}
