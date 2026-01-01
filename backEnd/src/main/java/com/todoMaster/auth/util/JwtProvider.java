package com.todoMaster.auth.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.vo.UserInfoVO;

import java.security.Key;
import java.time.Instant;
import java.util.Date;

/**
 * JWT(JSON Web Token) 인증 및 발급을 처리하는 유틸리티 클래스입니다.
 * Secret Key를 사용하여 토큰을 서명하고 검증합니다.
 */
@Component
@Slf4j
public class JwtProvider {

	// 토큰 서명에 사용되는 Secret Key
	private final Key key;
	// Access Token의 만료 시간 (밀리초)
	private final long accessExpireMillis;
	// Refresh Token의 만료 시간 (밀리초)
	private final int refreshTokenLongExpireDays;
	private final int refreshTokenShortExpireDays;

	/**
	 * 환경 변수에서 Secret, Access Token 만료 시간(분), Refresh Token 만료 시간(일)을 주입받아 초기화합니다.
	 * * @param secret JWT 서명에 사용될 비밀 키 (Base64 인코딩 권장)
	 * @param accessMinutes Access Token의 유효 기간 (분 단위)
	 * @param refreshDays Refresh Token의 유효 기간 (일 단위)
	 */
	public JwtProvider(@Value("${jwt.secret}") String secret, @Value("${jwt.access-expire-minutes}") long accessMinutes,
			@Value("${jwt.refresh_token_long_expire_days}") int refreshTokenLongExpireDays,
			@Value("${jwt.refresh_token_short_expire_days}") int refreshTokenShortExpireDays) {
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
		this.refreshTokenLongExpireDays = refreshTokenLongExpireDays;
		this.refreshTokenShortExpireDays = refreshTokenShortExpireDays;
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
	private String createRefreshToken(String userId, int expireDays) {
		Instant now = Instant.now();
		long expireMillis = expireDays * 24 * 60 * 60 * 1000L;
		return Jwts.builder()
				.setSubject(String.valueOf(userId)) // 토큰의 주체 (사용자 ID) 설정
				.setIssuedAt(Date.from(now)) // 토큰 발급 시간 설정 (iat)
				.setExpiration(Date.from(now.plusMillis(expireMillis))) // 토큰 만료 시간 설정 (exp)
				.signWith(key, SignatureAlgorithm.HS256) // HS256 알고리즘과 Key로 서명
				.compact(); // 토큰 생성 및 직렬화
	}
	
	/**
     * 장기간 만료되는 리프레시 토큰을 생성합니다.
     * 이 토큰은 사용자가 **로그인 유지**를 선택했을 때 사용됩니다.
     * 만료 기간: application.yml의 jwt.refresh_token_long_expire_days 값 적용
     * @param userId 토큰에 포함될 사용자 식별자
     * @return 롱 리프레시 토큰
     */
	public String createLongRefreshToken(String userId) {
		return createRefreshToken(userId, refreshTokenLongExpireDays);
	}

    /**
     * 단기간 만료되는 리프레시 토큰을 생성합니다.
     * 이 토큰은 사용자가 **로그인 유지**를 선택하지 않았을 때 사용됩니다.
     * 만료 기간: application.yml의 jwt.refresh_token_short_expire_days 값 적용
     * @param userId 토큰에 포함될 사용자 식별자
     * @return 숏 리프레시 토큰
     */
	public String createShortRefreshToken(String userId) {
		return createRefreshToken(userId, refreshTokenShortExpireDays);
	}
	
	/**
	 * verificationSToken(이메일 인증 토큰)을 발급하는 메서드입니다.
	 * * @param userId 사용자 고유 ID (Token의 Subject로 사용)
	 * @param email 로그인 이메일 (Token의 Custom Claim으로 포함)
	 * @return 발급된 verificationSToken (String)
	 */
	public String createVerificationSToken(Long userId, String email) {
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
     * 기존 리프레시 토큰의 유효 기간을 분석하여 롱/숏 타입을 구분하고, 
     * 동일한 타입으로 새로운 리프레시 토큰을 발급하여 토큰을 회전(Rotate)시킵니다.
     * * 토큰 타입 구분 기준: 토큰의 총 유효 기간 (exp - iat)과 롱 만료 기간(refreshTokenLongExpireDays)을 비교합니다.
     * * @param oldRefreshToken 기존에 사용되던 리프레시 토큰 문자열
     * @param userId 토큰에 포함될 사용자 식별자
     * @return 새로 발급된 리프레시 토큰 문자열
     */
	public String rotateRefreshToken(String oldRefreshToken, String userId) {
        // 기존 토큰에서 만료 시간(exp)과 발급 시간(iat)을 추출
		Date exp = getExpirationDateFromToken(oldRefreshToken);
		Date iat = getIssuedAtDateFromToken(oldRefreshToken);

        // 1. 토큰의 총 유효 기간 (exp - iat)을 밀리초 단위로 계산
		long totalValidityDuration = exp.getTime() - iat.getTime();
        
        // 2. 롱 리프레시 토큰의 기준 만료 기간을 밀리초 단위로 계산
		long longExpireMillis = (long) refreshTokenLongExpireDays * 24 * 60 * 60 * 1000L;

        // 3. 총 유효 기간이 롱 만료 기간과 1초(1000ms) 이내로 일치하는지 비교하여 타입 결정
		if (Math.abs(totalValidityDuration - longExpireMillis) < 1000) {
            // 롱 토큰이었으므로, 롱 토큰으로 재발급 (로그인 유지 세션)
			return createLongRefreshToken(userId);
		} else {
            // 숏 토큰이었으므로, 숏 토큰으로 재발급 (일반 세션)
			return createShortRefreshToken(userId);
		}
	}
	
    /**
     * 주어진 JWT 토큰에서 발급 시간 (Issued At, iat) 클레임을 추출합니다.
     * * @param token 파싱할 JWT 토큰 문자열
     * @return 토큰이 발급된 시각 (Date 객체)
     * @throws CustomException 토큰 파싱 실패 (잘못된 토큰, 변조 등) 시 INVALID_TOKEN 에러 발생
     */
	public Date getIssuedAtDateFromToken(String token) {
        // Jwts.parserBuilder()를 사용한 파싱 로직 (key 필드는 클래스 레벨에 정의되어 있다고 가정)
		try {
			Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
			return claims.getIssuedAt();
		} catch (JwtException | IllegalArgumentException e) {
			// 토큰이 변조되었거나 유효하지 않은 경우
			throw new CustomException(ErrorCode.INVALID_TOKEN);
		}
	}

    /**
     * 주어진 JWT 토큰에서 만료 시간 (Expiration Time, exp) 클레임을 추출합니다.
     * * @param token 파싱할 JWT 토큰 문자열
     * @return 토큰이 만료되는 시각 (Date 객체)
     * @throws CustomException 토큰 파싱 실패 (잘못된 토큰, 변조 등) 시 INVALID_TOKEN 에러 발생
     */
	public Date getExpirationDateFromToken(String token) {
        // Jwts.parserBuilder()를 사용한 파싱 로직
		try {
			Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
			return claims.getExpiration();
		} catch (JwtException | IllegalArgumentException e) {
			// 토큰이 변조되었거나 유효하지 않은 경우
			throw new CustomException(ErrorCode.INVALID_TOKEN);
		}
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
		} catch (JwtException e) {			
			return false;
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
	
	/**
	 * 토큰에서 사용자 고유 ID(Subject)를 추출하는 메서드입니다.
	 * * @param token 클레임을 추출할 JWT
	 * @return 토큰에 포함된 사용자 email
	 * @throws JwtException 유효하지 않은 토큰일 경우 예외 발생
	 */
	public String getEmail(String token) {
		try {
			// 토큰을 파싱하여 JWT 본문(Body)에 해당하는 Claims를 가져옵니다.
			Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
			return claims.get("email").toString();
		} catch (ExpiredJwtException e) {
			throw new CustomException(ErrorCode.EXPIRED_TOKEN);
		} catch (JwtException | IllegalArgumentException e) {
			throw new CustomException(ErrorCode.INVALID_TOKEN);
		}
	}
	
	/**
	 *  특수 목적 토큰 (Verification / Reset) 관련 로직
	 * @param token
	 * @return
	 */	
	    public UserInfoVO extractClaimsFromVerificationToken(String token) {
			UserInfoVO user = new UserInfoVO();
	    	
	    	// 1. 토큰 기본 검증
	    	 if (!validateToken(token)) {
	             throw new CustomException(ErrorCode.TOKEN_AUTHENTICATION_FAILED);
	         }
	
	    	try {
	    		// 2. 토큰에서 이메일 / userId 꺼내기
	    		String email = getEmail(token);
	    		Long userId = getUserId(token);
	    		
	    		// 3. 꺼낸값 user에 저장
	    		user.setEmail(email);
	    		user.setUserId(userId);
	    	} catch (JwtException | IllegalArgumentException e) {
	    		throw new CustomException(ErrorCode.TOKEN_AUTHENTICATION_FAILED);
			}    	 
	    	
	    	
	    	return user;
	    	
	    }		
	}