package com.todoMaster.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 비밀번호 변경 요청 DTO
 */
@Data
public class ChangePasswordRequest {
	@NotBlank(message = "현재 비밀번호를 입력해주세요.")
	private String currentPassword;

	@NotBlank(message = "새 비밀번호를 입력해주세요.")
	@Size(min = 8, max = 64, message = "새 비밀번호는 8자 이상이어야 합니다.")
	private String newPassword;
}
