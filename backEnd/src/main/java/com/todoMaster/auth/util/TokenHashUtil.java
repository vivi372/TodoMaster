package com.todoMaster.auth.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Component;

/**
 * 리프레시 토큰의 해싱 및 검증을 위한 유틸리티 클래스입니다.
 * 평문 토큰을 DB에 저장하지 않고, 해싱된 형태로 안전하게 저장하는 로직을 제공합니다.
 */
@Component
public class TokenHashUtil {

    private static final int SALT_LENGTH = 16; // 16바이트 솔트 (128비트)

    /**
     * 무작위 솔트(Salt)를 생성합니다.
     * @return Base64로 인코딩된 솔트 문자열
     */
    public String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);
        // DB 저장을 위해 바이트 배열을 문자열로 변환 (Base64 인코딩)
        return Base64.getEncoder().encodeToString(salt);
    }

    /**
     * 평문 토큰과 솔트를 결합하여 SHA-256 해시를 생성합니다.
     * @param plainToken 평문 리프레시 토큰
     * @param salt 토큰 해싱에 사용할 솔트 (Base64 인코딩된 문자열)
     * @return Base64로 인코딩된 해시 문자열
     */
    public String hashToken(String plainToken, String salt) {
        try {
            // SHA-256 해시 함수 인스턴스 생성
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            
            // 토큰과 솔트를 결합하여 바이트로 변환
            String tokenWithSalt = plainToken + salt;
            
            // 해싱 수행
            byte[] encodedhash = digest.digest(tokenWithSalt.getBytes(StandardCharsets.UTF_8));
            
            // 해시된 바이트 배열을 Base64 문자열로 변환하여 반환
            return Base64.getEncoder().encodeToString(encodedhash);

        } catch (NoSuchAlgorithmException e) {
            // 시스템에 SHA-256 알고리즘이 없을 경우 (거의 발생하지 않음)
            throw new RuntimeException("SHA-256 algorithm not found.", e);
        }
    }

    /**
     * 사용자로부터 받은 평문 토큰과 DB에 저장된 해시값을 비교하여 유효성을 검증합니다.
     * @param plainToken 사용자로부터 받은 평문 토큰
     * @param storedSalt DB에 저장된 솔트
     * @param storedHashedToken DB에 저장된 해싱된 토큰
     * @return 토큰이 유효하면 true, 아니면 false
     */
    public boolean verifyToken(String plainToken, String storedSalt, String storedHashedToken) {
        // 수신된 평문 토큰과 저장된 솔트를 사용하여 새로 해싱 값을 계산합니다.
        String newHashedToken = hashToken(plainToken, storedSalt);
        
        // 계산된 해시 값과 DB에 저장된 해시 값을 비교합니다.
        return newHashedToken.equals(storedHashedToken);
    }
}
