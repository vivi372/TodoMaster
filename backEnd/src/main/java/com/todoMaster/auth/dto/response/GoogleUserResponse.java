package com.todoMaster.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GoogleUserResponse {

    private String sub;

    private String email;

    @JsonProperty("email_verified")
    private boolean emailVerified;

    private String name;

    private String picture;

    private String locale;
}
