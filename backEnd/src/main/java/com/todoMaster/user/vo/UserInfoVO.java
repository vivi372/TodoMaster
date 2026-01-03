package com.todoMaster.user.vo;

import java.time.LocalDate;
import lombok.Data;

/**
 * USER_IFNO 테이블과 매칭
 */
@Data
public class UserInfoVO {
	// 사용자 고유 ID
    private Long userId;
    // 로그인 이메일
    private String email;
    // 암호화된 비밀번호
    private String password;
    // 사용자 닉네임
    private String nickname;
    // 프로필 이미지 URL
    private String profileImg;
    // 프로필 이미지 상태
    private ProfileImageStatus profileImageStatus;
    // 이메일 인증 여부
    private String isVerified;
    // GOOGLE / KAKAO / NAVER
    private String provider;
    // 소셜 고유 사용자 ID
    private String providerId;
    // 토큰 해싱을 휘한 솔트
    private String salt;
    // 해싱된 리프레쉬 토큰
    private String refreshToken;
    // 가입일
    private LocalDate createdAt;
    // 수정일
    private String updatedAt;
}
