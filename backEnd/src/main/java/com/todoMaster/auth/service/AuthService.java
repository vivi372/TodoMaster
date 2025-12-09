package com.todoMaster.auth.service;

import com.todoMaster.auth.dto.LoginRequest;
import com.todoMaster.auth.dto.UserSignupRequest;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.auth.util.TokenHashUtil;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.UserInfoVO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 인증 관련 비즈니스 로직 담당
 * - 로그인 (Access/Refresh 발급, DB에 refresh 저장)
 * - 리프레시 토큰으로 재발급
 * - 로그아웃 (DB refresh 삭제)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final TokenHashUtil tokenHashUtil;
    
    public void signup(UserSignupRequest req) {

        if (userMapper.countByEmail(req.getEmail()) > 0) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATION);
        }

        UserInfoVO vo = new UserInfoVO();
        vo.setEmail(req.getEmail());
        vo.setPassword(passwordEncoder.encode(req.getPassword()));
        vo.setNickname(req.getNickname());

        int result = userMapper.insertUser(vo);
        
        if (result == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 로그인 처리
     * @return "access::refresh" 문자열 반환 — 컨트롤러에서 분리하여 처리
     */
    public String login(LoginRequest req) {
        // 이메일로 사용자 조회
        UserInfoVO user = userMapper.findByEmail(req.getEmail());
        if (user == null) throw new CustomException(ErrorCode.USER_NOT_FOUND);

        // 비밀번호 검증
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        // 액세스/리프레시 토큰 생성
        String access = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
        String refresh = jwtProvider.createRefreshToken(user.getUserId());

        int updated;
        
        // rememberMe에 따라 DB에 refresh 저장 (또는 항상 저장해도 됨)
        if (req.isRememberMe()) {
        	// 1. 솔트 생성
            String salt = tokenHashUtil.generateSalt();
            
            // 2. 토큰 해싱
            String hashedToken = tokenHashUtil.hashToken(refresh, salt);
        	
            updated = userMapper.updateRefreshToken(user.getUserId(), hashedToken, salt);
        } else {
            // 로그인 유지 원치 않으면 DB에 저장하지 않음(혹은 null 저장)
        	updated = userMapper.updateRefreshToken(user.getUserId(), null, null);
        }
        
        if (updated == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        return access + "::" + refresh;
    }

    /**
     * refresh 토큰으로 access 재발급 및 refresh 회전
     */
    public String refresh(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
        Long userId = jwtProvider.getUserId(refreshToken);
        UserInfoVO user = userMapper.findById(userId);
        if (user == null) throw new CustomException(ErrorCode.USER_NOT_FOUND);
        

        String storedToken = user.getRefreshToken();
        String storedSalt = user.getSalt();
        
        if (storedToken == null) {
        	throw new CustomException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        
        if (storedToken == null || !tokenHashUtil.verifyToken(refreshToken, storedSalt, storedToken)) {
            throw new  CustomException(ErrorCode.REFRESH_TOKEN_MISMATCH);
        }

        // 토큰 재발급 (회전)
        String newAccess = jwtProvider.createAccessToken(userId, user.getEmail());
        String newRefresh = jwtProvider.createRefreshToken(userId);
        
        // 1. 솔트 생성
        String salt = tokenHashUtil.generateSalt();
        
        // 2. 토큰 해싱
        String hashedToken = tokenHashUtil.hashToken(newRefresh, salt);

        // DB 갱신
        userMapper.updateRefreshToken(userId, hashedToken, salt);

        return newAccess + "::" + newRefresh;
    }

    /**
     * 로그아웃: DB 저장된 refresh 토큰 삭제
     */
    public void logout(Long userId) {
    	int result = userMapper.updateRefreshToken(userId, null, null);
    	
    	if (result == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Access token에서 userId 얻는 유틸(컨트롤러에서 직접 쓰기 편리하도록)
     */
    public Long getUserIdFromAccessToken(String accessToken) {
        if (!jwtProvider.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 액세스 토큰입니다.");
        }
        return jwtProvider.getUserId(accessToken);
    }
}
