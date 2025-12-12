package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 소셜 로그인 요청 DTO
 */
@Getter
@Setter
public class SocialLoginRequest {

    @NotBlank(message = "provider 값이 필요합니다.")
    private String provider;

    @NotBlank(message = "code 값이 필요합니다.")
    private String code;
}
