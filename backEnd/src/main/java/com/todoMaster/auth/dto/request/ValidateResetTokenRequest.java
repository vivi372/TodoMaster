package com.todoMaster.auth.dto.request;

import lombok.Data;

@Data
public class ValidateResetTokenRequest {

	private String resetToken;
	
}
