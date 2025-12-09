package com.todoMaster.auth.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;

import java.security.Key;
import java.time.Instant;
import java.util.Date;

/**
 * JWT(JSON Web Token) 인증 및 발급을 처리하는 유틸리티 클래스입니다.
 * Secret Key를 사용하여 토큰을 서명하고 검증합니다.
 */
@Component
public class JwtProvider {

	// 토큰 서명에 사용되는 Secret Key
	private final Key key;
	// Access Token의 만료 시간 (밀리초)
	private final long accessExpireMillis;
	// Refresh Token의 만료 시간 (밀리초)
	private final long refreshExpireMillis;

	/**
	 * 환경 변수에서 Secret, Access Token 만료 시간(분), Refresh Token 만료 시간(일)을 주입받아 초기화합니다.
	 * * @param secret JWT 서명에 사용될 비밀 키 (Base64 인코딩 권장)
	 * @param accessMinutes Access Token의 유효 기간 (분 단위)
	 * @param refreshDays Refresh Token의 유효 기간 (일 단위)
	 */
	public JwtProvider(@Value("${jwt.secret}") String secret, @Value("${jwt.access-expire-minutes}") long accessMinutes,
			@Value("${jwt.refresh-expire-days}") long refreshDays) {
		// secret은 운영에서 충분히 긴 랜덤 문자열로 설정해야 함
        if (secret == null || secret.length() < 32) {
            // 짧은 키는 HMAC SHA 알고리즘에 적합하지 않으므로 미리 체크
            throw new IllegalArgumentException("JWT secret is too short. Use a secure, long secret.");
        }
		// 주입받은 secret 문자열을 바이트 배열로 변환하여 HMAC SHA 키를 생성합니다.
		this.key = Keys.hmacShaKeyFor(secret.getBytes());
		// Access Token 만료 시간을 '분'에서 '밀리초'로 변환합니다.
		this.accessExpireMillis = accessMinutes * 60 * 1000;
		// Refresh Token 만료 시간을 '일'에서 '밀리초'로 변환합니다.
		this.refreshExpireMillis = refreshDays * 24 * 60 * 60 * 1000;
	}
	
	/**
	 * AccessToken을 발급하는 메서드입니다.
	 * * @param userId 사용자 고유 ID (Token의 Subject로 사용)
	 * @param email 로그인 이메일 (Token의 Custom Claim으로 포함)
	 * @return 발급된 AccessToken (String)
	 */
	public String createAccessToken(Long userId, String email) {
		Instant now = Instant.now();
		return Jwts.builder()
				.setSubject(String.valueOf(userId)) // 토큰의 주체 (사용자 ID) 설정
				.setIssuedAt(Date.from(now)) // 토큰 발급 시간 설정 (iat)
				.setExpiration(Date.from(now.plusMillis(accessExpireMillis))) // 토큰 만료 시간 설정 (exp)
				.claim("email", email) // 커스텀 클레임 추가 (이메일)
				.signWith(key, SignatureAlgorithm.HS256) // HS256 알고리즘과 Key로 서명
				.compact(); // 토큰 생성 및 직렬화
	}

	/**
	 * RefreshToken을 발급하는 메서드입니다.
	 * AccessToken보다 긴 유효 기간을 가집니다.
	 * * @param userId 사용자 고유 ID (Token의 Subject로 사용)
	 * @return 발급된 RefreshToken (String)
	 */
	public String createRefreshToken(Long userId) {
		Instant now = Instant.now();
		return Jwts.builder()
				.setSubject(String.valueOf(userId)) // 토큰의 주체 (사용자 ID) 설정
				.setIssuedAt(Date.from(now)) // 토큰 발급 시간 설정 (iat)
				.setExpiration(Date.from(now.plusMillis(refreshExpireMillis))) // 토큰 만료 시간 설정 (exp)
				.signWith(key, SignatureAlgorithm.HS256) // HS256 알고리즘과 Key로 서명
				.compact(); // 토큰 생성 및 직렬화
	}

	
	/**
	 * 주어진 토큰의 유효성을 검증하는 메서드입니다.
	 * 만료 시간, 서명 오류, 형식 오류 등을 체크합니다.
	 * * @param token 검증할 JWT
	 * @return 토큰이 유효하면 {@code true}, 만료되었거나 서명이 유효하지 않으면 {@code false}
	 */
	public boolean validateToken(String token) {
		try {
			// 서명 키를 설정하고 토큰을 파싱하여 Claims(payload)를 추출 시도
			Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
			return true; // 성공적으로 파싱되면 유효함
		} catch (ExpiredJwtException e) {
			// 만료
			throw new CustomException(ErrorCode.EXPIRED_TOKEN);
		} catch (JwtException | IllegalArgumentException e) {
			// 서명불일치, 변조, 잘못된 토큰 등
			throw new CustomException(ErrorCode.INVALID_TOKEN);
		}
	}

	/**
	 * 토큰에서 사용자 고유 ID(Subject)를 추출하는 메서드입니다.
	 * * @param token 클레임을 추출할 JWT
	 * @return 토큰에 포함된 사용자 고유 ID (Long 타입)
	 * @throws JwtException 유효하지 않은 토큰일 경우 예외 발생
	 */
	public Long getUserId(String token) {
		try {
			// 토큰을 파싱하여 JWT 본문(Body)에 해당하는 Claims를 가져옵니다.
			Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
			// Subject(사용자 ID)를 가져와 Long 타입으로 변환 후 반환합니다.
			return Long.valueOf(claims.getSubject());
		} catch (ExpiredJwtException e) {
			throw new CustomException(ErrorCode.EXPIRED_TOKEN);
		} catch (JwtException | IllegalArgumentException e) {
			throw new CustomException(ErrorCode.INVALID_TOKEN);
		}
	}
}