package com.todoMaster.auth.util;

import java.security.SecureRandom;

public class VerificationCodeGenerator {

    private static final int MIN_VALUE = 100000; // 100,000 (6자리 시작)
    private static final int MAX_VALUE = 900000; // 900,000 (생성 범위)

    public static String generateCode() {
        // 암호학적으로 안전한 난수 생성기 사용
        SecureRandom random = new SecureRandom();

        // 100000 (포함) ~ 999999 (포함) 사이의 숫자 생성
        // 900000은 (999999 - 100000 + 1)
        int codeInt = random.nextInt(MAX_VALUE) + MIN_VALUE;
        
        return String.valueOf(codeInt);
    }
}
