package com.todoMaster.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 유저 프로필 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
	// 사용자 고유 ID
    private Long userId;
    // 로그인 이메일
    private String email;
    // 사용자 닉네임
    private String nickname;
    // 프로필 이미지 URL
    private String profileImg;
    // GOOGLE / KAKAO / NAVER
    private String provider;    
}
