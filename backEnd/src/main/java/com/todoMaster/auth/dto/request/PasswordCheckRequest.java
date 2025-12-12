package com.todoMaster.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordCheckRequest {

    @NotBlank(message = "비밀번호는 필수 입력값입니다.")
    private String password;
}
