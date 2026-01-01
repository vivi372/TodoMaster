package com.todoMaster.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailChangeExecuteRequest {
    
    @NotBlank(message = "새로운 이메일을 입력해주세요.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String newEmail;

    @NotBlank(message = "인증 코드를 입력해주세요.")
    private String verificationCode;
}
