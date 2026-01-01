package com.todoMaster.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class authenticateForEmailChangeRequest {
	
	@NotBlank(message = "현재 비밀번호를 입력해주세요.")
	private String currentPassword;

	@NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일을 입력하세요.")
    private String email;
}
