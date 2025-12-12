package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
/**
 * 소셜 회원가입 요청 DTO
 */
public class SocialSignupRequest {


    @NotBlank(message = "provider 값이 필요합니다.")
    private String provider; // kakao, google, naver

    @NotBlank(message = "인가코드(code)가 필요합니다.")
    private String code;
}
