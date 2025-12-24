package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class AccountActivationRequest {
	
	// 인증 토큰
	@NotBlank(message = "인증 토큰은 필수입니다.")
    private String token;

}
