package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 소셜 회원가입 요청 DTO
 */
@Data
public class UserSocialSignupRequest {
	
	// 로그인 이메일
	@NotBlank(message = "이메일은 필수 입력입니다.")
    private String email;

	// 사용자 닉네임
    @NotBlank(message = "닉네임은 필수 입력입니다.")
    private String nickname;

    // GOOGLE / KAKAO / NAVER
    @NotBlank(message = "Provider 값이 필요합니다.")
    private String provider; // GOOGLE, KAKAO, NAVER

    // 소셜 고유 사용자 ID
    @NotBlank(message = "소셜 고유 ID가 필요합니다.")
    private String providerId;
}
