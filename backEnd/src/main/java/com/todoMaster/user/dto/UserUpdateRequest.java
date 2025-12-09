package com.todoMaster.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {
	
	@NotBlank(message = "닉네임은 필수값입니다.")
	@Size(min = 2, max = 30, message = "닉네임은 2~30자여야 합니다.")
	private String nickname;

	@Size(max = 300, message = "프로필 이미지 URL은 300자 이하여야 합니다.")
	private String profileImg;
}
