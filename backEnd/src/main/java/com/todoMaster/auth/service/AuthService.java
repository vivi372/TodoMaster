package com.todoMaster.auth.service;

import com.todoMaster.auth.dto.LoginRequest;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.auth.util.TokenHashUtil;
import com.todoMaster.user.dto.UserSignupRequest;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.UserInfoVO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
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
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }

        UserInfoVO vo = new UserInfoVO();
        vo.setEmail(req.getEmail());
        vo.setPassword(passwordEncoder.encode(req.getPassword()));
        vo.setNickname(req.getNickname());

        userMapper.insertUser(vo);
    }

    /**
     * 로그인 처리
     * @return "access::refresh" 문자열 반환 — 컨트롤러에서 분리하여 처리
     */
    public String login(LoginRequest req) {
        // 이메일로 사용자 조회
        UserInfoVO user = userMapper.findByEmail(req.getEmail());
        if (user == null) throw new IllegalArgumentException("사용자가 없습니다.");

        // 비밀번호 검증
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 액세스/리프레시 토큰 생성
        String access = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
        String refresh = jwtProvider.createRefreshToken(user.getUserId());

        // rememberMe에 따라 DB에 refresh 저장 (또는 항상 저장해도 됨)
        if (req.isRememberMe()) {
        	// 1. 솔트 생성
            String salt = tokenHashUtil.generateSalt();
            
            // 2. 토큰 해싱
            String hashedToken = tokenHashUtil.hashToken(refresh, salt);
        	
            userMapper.updateRefreshToken(user.getUserId(), hashedToken, salt);
        } else {
            // 로그인 유지 원치 않으면 DB에 저장하지 않음(혹은 null 저장)
            userMapper.updateRefreshToken(user.getUserId(), null, null);
        }

        return access + "::" + refresh;
    }

    /**
     * refresh 토큰으로 access 재발급 및 refresh 회전
     */
    public String refresh(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }
        Long userId = jwtProvider.getUserId(refreshToken);
        UserInfoVO user = userMapper.findById(userId);
        if (user == null) throw new IllegalArgumentException("사용자 없음");

        String storedToken = user.getRefreshToken();
        String storedSalt = user.getSalt();
        
        log.info("사용자 정보"+user);
        
        if (storedToken == null || !tokenHashUtil.verifyToken(refreshToken, storedSalt, storedToken)) {
            throw new IllegalArgumentException("리프레시 토큰 불일치");
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
        userMapper.updateRefreshToken(userId, null, null);
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
