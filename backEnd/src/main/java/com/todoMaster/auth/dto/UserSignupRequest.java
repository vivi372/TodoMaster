package com.todoMaster.auth.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 회원가입 요청 DTO
 */
@Data
public class UserSignupRequest {
	// 로그인 이메일
	@Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일은 필수 입력입니다.")
    private String email;
	
	// 비밀번호
    @NotBlank(message = "비밀번호는 필수 입력입니다.")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    private String password;

    // 사용자 닉네임
    @NotBlank(message = "닉네임은 필수 입력입니다.")
    private String nickname;
    
}
