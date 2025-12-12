package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

/**
 * 로그인 요청 DTO.
 * Validation을 통해 요청값 검증을 수행한다.
 */
@Data
public class LoginRequest {
	
	// 로그인 이메일
	@NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일을 입력하세요.")
    private String email;
	
	// 비밀번호
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;

    // rememberMe 체크박스(로그인 유지 여부)
    private boolean rememberMe;
}
