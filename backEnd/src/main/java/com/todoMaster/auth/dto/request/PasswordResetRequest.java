package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 비밀번호 재설정 요청 DTO
 */
@Data
public class PasswordResetRequest {

	// 비밀번호
    @NotBlank(message = "비밀번호는 필수 입력입니다.")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    private String password;
    
    // 리셋 토큰
    @NotBlank(message = "토큰은 필수 입력입니다.")
    private String resetToken;
}
