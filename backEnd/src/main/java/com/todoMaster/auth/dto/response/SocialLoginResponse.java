package com.todoMaster.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 소셜 로그인 응답 DTO
 */
@Getter
@AllArgsConstructor
@Builder
public class SocialLoginResponse {
    private String accessToken;
}
