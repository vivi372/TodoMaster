package com.todoMaster.auth.service;

import java.time.Duration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.auth.util.VerificationCodeGenerator;
import com.todoMaster.email.service.EmailService;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class VerificationService {
	
    private final EmailService emailService;   
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, String> redisTemplate;

    /**
     * verificationToken를 생성하고 이메일을 보내주는 함수
     * @param email 사용자 고유 ID
     * @param userId 로그인 이메일
     * @param nickName 사용지 이름
     */
    public void createVerificationTokenAndSendEmail(String email, Long userId, String nickName) {
        // 1. 인증 토큰 생성
        String verificationToken = jwtProvider.createVerificationSToken(userId,email);        
        
        // 2. 이메일 발송 요청 (EmailService에 위임)
        String subject = "하루로그 회원가입을 완료해 주세요. 이메일 인증이 필요합니다.";
        String link = "http://localhost:5173/verify?token=" + verificationToken;
        String content = "<!DOCTYPE html>\r\n"
        		+ "<html lang=\"ko\">\r\n"
        		+ "<head>\r\n"
        		+ "    <meta charset=\"UTF-8\">\r\n"
        		+ "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n"
        		+ "    <title>이메일 인증을 완료해주세요</title>\r\n"
        		+ "    <style>\r\n"
        		+ "        /* 기본 스타일 초기화 */\r\n"
        		+ "        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\r\n"
        		+ "        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\r\n"
        		+ "        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }\r\n"
        		+ "        a { text-decoration: none; }\r\n"
        		+ "        \r\n"
        		+ "        /* 버튼 스타일 */\r\n"
        		+ "        .button {\r\n"
        		+ "            display: inline-block;\r\n"
        		+ "            padding: 12px 25px;\r\n"
        		+ "            font-size: 16px;\r\n"
        		+ "            font-weight: bold;\r\n"
        		+ "            color: #ffffff !important;\r\n"
        		+ "            background-color: #fce5884d; /* 서비스의 메인 컬러 */\r\n"
        		+ "            border-radius: 8px;\r\n"
        		+ "            text-decoration: none;\r\n"
        		+ "            text-align: center;\r\n"
        		+ "            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\r\n"
        		+ "        }\r\n"
        		+ "    </style>\r\n"
        		+ "</head>\r\n"
        		+ "<body style=\"margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;\">\r\n"
        		+ "\r\n"
        		+ "    <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed;\">\r\n"
        		+ "        <tr>\r\n"
        		+ "            <td align=\"center\" style=\"padding: 20px 0;\">\r\n"
        		+ "                <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);\">\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td align=\"center\" style=\"padding: 30px 20px 10px; background-color: #fce5884d; \">\r\n"
        		+ "                            <h1 style=\"margin: 0; font-size: 28px; font-weight: 700;\">하루로그</h1>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td style=\"padding: 40px 40px 20px;\">\r\n"
        		+ "                            \r\n"
        		+ "                            <h2 style=\"font-size: 22px; margin-top: 0; margin-bottom: 20px; color: #333333;\">계정을 활성화하려면 이메일 인증이 필요합니다.</h2>\r\n"
        		+ "\r\n"
        		+ "                            <p style=\"font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;\">\r\n"
        		+ "                                "+nickName+"님, 저희 하루로그에 가입해 주셔서 진심으로 감사합니다.\r\n"
        		+ "                            </p>\r\n"
        		+ "                            <p style=\"font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 30px;\">\r\n"
        		+ "                                아래 '계정 활성화하기' 버튼을 클릭하여 이메일 주소를 인증해 주세요. 이 과정은 회원님의 계정을 안전하게 보호하기 위한 필수 절차입니다.\r\n"
        		+ "                            </p>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td align=\"center\" style=\"padding: 0 40px 30px;\">\r\n"
        		+ "                            <a href=\""+link+"\" class=\"button\" target=\"_blank\">\r\n"
        		+ "                                계정 활성화하기\r\n"
        		+ "                            </a>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "\r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td style=\"padding: 0 40px 40px;\">\r\n"
        		+ "                            <div style=\"border-top: 1px solid #eeeeee; padding-top: 20px;\">\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #777777; margin-bottom: 10px;\">\r\n"
        		+ "                                    <strong>[유효 시간 안내]</strong> 이 인증 링크는 발송 시점으로부터 15분 동안만 유효합니다. 시간이 초과된 경우, 다시 회원가입 페이지에서 재전송을 요청해 주세요.\r\n"
        		+ "                                </p>\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #777777; margin-bottom: 15px;\">\r\n"
        		+ "                                    <strong>[수동 인증]</strong> 버튼이 작동하지 않거나 보이지 않는다면, 아래 링크를 복사하여 브라우저에 직접 붙여넣어 주세요.<br>\r\n"
        		+ "                                    <a href=\""+link+"\" style=\"color: #4CAF50; word-break: break-all;\">\r\n"
        		+ "                                        "+link+"\r\n"
        		+ "                                    </a>\r\n"
        		+ "                                </p>\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #cc0000; margin-bottom: 0;\">\r\n"
        		+ "                                    <strong>[안전 경고]</strong> 이 요청을 직접 하지 않았다면, 이 메일을 무시하고 삭제해 주십시오. 고객님의 계정은 안전하게 보호됩니다.\r\n"
        		+ "                                </p>\r\n"
        		+ "                            </div>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "\r\n"
        		+ "                </table>\r\n"
        		+ "            </td>\r\n"
        		+ "        </tr>\r\n"
        		+ "    </table>\r\n"
        		+ "\r\n"
        		+ "</body>\r\n"
        		+ "</html>";
        
        emailService.sendEmail(email, subject, content); 
    }
    
    /**
     * resetToken를 생성하고 이메일을 보내주는 함수
     * @param email 사용자 고유 ID
     * @param userId 로그인 이메일
     * @param nickName 사용지 이름
     */
    public void createResetTokenAndSendEmail(String email, Long userId, String nickName) {
        // 1. 인증 토큰 생성
        String resetToken = jwtProvider.createVerificationSToken(userId,email);        
        
        // 2. 이메일 발송 요청 (EmailService에 위임)
        String subject = "하루로그 비밀번호 재설정을 완료해주세요.";
        String link = "http://localhost:5173/reset-password?token=" + resetToken;
        String content = "<!DOCTYPE html>\r\n"
        		+ "<html lang=\"ko\">\r\n"
        		+ "<head>\r\n"
        		+ "    <meta charset=\"UTF-8\">\r\n"
        		+ "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n"
        		+ "    <title>비밀번호 재설정 요청 확인</title>\r\n"
        		+ "    <style>\r\n"
        		+ "        /* 기본 스타일 초기화 */\r\n"
        		+ "        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\r\n"
        		+ "        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\r\n"
        		+ "        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }\r\n"
        		+ "        a { text-decoration: none; }\r\n"
        		+ "        \r\n"
        		+ "        /* 버튼 스타일 */\r\n"
        		+ "        .button {\r\n"
        		+ "            display: inline-block;\r\n"
        		+ "            padding: 12px 25px;\r\n"
        		+ "            font-size: 16px;\r\n"
        		+ "            font-weight: bold;\r\n"
        		+ "            color: #ffffff !important;\r\n"
        		+ "            background-color: #fce5884d; /* 서비스의 메인 컬러 */\r\n"
        		+ "            border-radius: 8px;\r\n"
        		+ "            text-decoration: none;\r\n"
        		+ "            text-align: center;\r\n"
        		+ "            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\r\n"
        		+ "        }\r\n"
        		+ "    </style>\r\n"
        		+ "</head>\r\n"
        		+ "<body style=\"margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;\">\r\n"
        		+ "\r\n"
        		+ "    <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed;\">\r\n"
        		+ "        <tr>\r\n"
        		+ "            <td align=\"center\" style=\"padding: 20px 0;\">\r\n"
        		+ "                <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);\">\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td align=\"center\" style=\"padding: 30px 20px 10px; background-color: #fce5884d; \">\r\n"
        		+ "                            <h1 style=\"margin: 0; font-size: 28px; font-weight: 700;\">하루로그</h1>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td style=\"padding: 40px 40px 20px;\">\r\n"
        		+ "                            \r\n"
        		+ "                            <h2 style=\"font-size: 22px; margin-top: 0; margin-bottom: 20px; color: #333333;\">비밀번호 재설정을 요청하셨습니다.</h2>\r\n"
        		+ "\r\n"
        		+ "                            <p style=\"font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;\">\r\n"
        		+ "                                안녕하세요. **"+nickName+"**님,\r\n"
        		+ "                            </p>\r\n"
        		+ "                            <p style=\"font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 30px;\">\r\n"
        		+ "                                회원님의 계정에 대한 비밀번호 재설정 요청이 접수되었습니다. 새로운 비밀번호를 설정하시려면 아래 버튼을 클릭해 주세요.\r\n"
        		+ "                            </p>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td align=\"center\" style=\"padding: 0 40px 30px;\">\r\n"
        		+ "                            <a href=\""+link+"\" class=\"button\" target=\"_blank\">\r\n"
        		+ "                                새 비밀번호 설정하기\r\n"
        		+ "                            </a>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "\r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td style=\"padding: 0 40px 40px;\">\r\n"
        		+ "                            <div style=\"border-top: 1px solid #eeeeee; padding-top: 20px;\">\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #777777; margin-bottom: 10px;\">\r\n"
        		+ "                                    <strong>[유효 시간 안내]</strong> 보안을 위해 이 재설정 링크는 발송 시점으로부터 **15분** 동안만 유효합니다. 시간이 초과된 경우, 다시 비밀번호 찾기를 요청해 주세요.\r\n"
        		+ "                                </p>\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #777777; margin-bottom: 15px;\">\r\n"
        		+ "                                    <strong>[수동 재설정]</strong> 버튼이 작동하지 않거나 보이지 않는다면, 아래 링크를 복사하여 브라우저에 직접 붙여넣어 주세요.<br>\r\n"
        		+ "                                    <a href=\""+link+"\" style=\"color: #4CAF50; word-break: break-all;\">\r\n"
        		+ "                                        "+link+"\r\n"
        		+ "                                    </a>\r\n"
        		+ "                                </p>\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #cc0000; margin-bottom: 0;\">\r\n"
        		+ "                                    <strong>[안전 경고]</strong> **비밀번호 재설정을 요청하지 않았다면,** 이 메일을 즉시 무시하고 삭제해 주십시오. 고객님의 계정은 안전하게 보호됩니다. 이 메일 클릭 시 기존 비밀번호는 변경되지 않습니다.\r\n"
        		+ "                                </p>\r\n"
        		+ "                            </div>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "\r\n"
        		+ "                </table>\r\n"
        		+ "            </td>\r\n"
        		+ "        </tr>\r\n"
        		+ "    </table>\r\n"
        		+ "\r\n"
        		+ "</body>\r\n"
        		+ "</html>";
        
        try {        	
        	emailService.sendEmail(email, subject, content); 
        } catch (Exception e) {
        	// 보안을 위해 예외는 안 던지고 로그만 찍기
        	log.error("JavaMailSender Error occurred!", e);
        }
    }
    
    /** 이메일에 인증 코드 전송 */
    private void requestNewEmailVerifiCode(String email) {
		// 1. 인증 코드 생성
		String verifiCode = VerificationCodeGenerator.generateCode();

		// 2. Redis에 인증번호 저장 (5분 TTL)
		String authCodeKey = "AUTH_CODE:" + email;
		ValueOperations<String, String> valueOperations = redisTemplate.opsForValue();
		valueOperations.set(authCodeKey, verifiCode, Duration.ofMinutes(5));
		log.info("이메일: {}, 인증번호: {} Redis에 저장",email, verifiCode);

		// 3. 해당 인증 코드를 담아 이메일 발송
		String subject = "[하루로그] 이메일 주소 인증 코드입니다 (유효 시간 5분)";
		String content = "<!DOCTYPE html>\r\n"
        		+ "<html lang=\"ko\">\r\n"
        		+ "<head>\r\n"
        		+ "    <meta charset=\"UTF-8\">\r\n"
        		+ "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n"
        		+ "    <title>이메일 인증 코드 확인</title>\r\n" // 제목 변경
        		+ "    <style>\r\n"
        		+ "        /* 기본 스타일 초기화 */\r\n"
        		+ "        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\r\n"
        		+ "        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\r\n"
        		+ "        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }\r\n"
        		+ "        a { text-decoration: none; }\r\n"
        		+ "        \r\n"
        		+ "        /* 인증 코드 박스 스타일 (버튼 스타일을 재활용하여 코드에 맞게 수정) */\r\n"
        		+ "        .code-box {\r\n"
        		+ "            display: inline-block;\r\n"
        		+ "            padding: 15px 30px; /* 패딩 조정 */\r\n"
        		+ "            font-size: 32px; /* 코드 크기 키움 */\r\n"
        		+ "            font-weight: bold;\r\n"
        		+ "            color: #333333; /* 텍스트 색상 */\r\n"
        		+ "            background-color: #F8F8F8; /* 배경색 변경 */\r\n"
        		+ "            border: 2px dashed #fce5884d; /* 테두리 추가 */\r\n"
        		+ "            border-radius: 8px;\r\n"
        		+ "            text-align: center;\r\n"
        		+ "            letter-spacing: 15px; /* 간격 추가 */\r\n"
        		+ "            margin: 20px 0;\r\n"
        		+ "        }\r\n"
        		+ "    </style>\r\n"
        		+ "</head>\r\n"
        		+ "<body style=\"margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;\">\r\n"
        		+ "\r\n"
        		+ "    <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed;\">\r\n"
        		+ "        <tr>\r\n"
        		+ "            <td align=\"center\" style=\"padding: 20px 0;\">\r\n"
        		+ "                <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);\">\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td align=\"center\" style=\"padding: 30px 20px 10px; background-color: #fce5884d; \">\r\n"
        		+ "                            <h1 style=\"margin: 0; font-size: 28px; font-weight: 700;\">하루로그 인증</h1>\r\n" // 제목 변경
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td style=\"padding: 40px 40px 20px; text-align: center;\">\r\n" // 가운데 정렬 추가
        		+ "                            \r\n"
        		+ "                            <h2 style=\"font-size: 22px; margin-top: 0; margin-bottom: 20px; color: #333333;\">이메일 주소 인증을 완료해 주세요.</h2>\r\n" // 제목 변경\r\n"
        		+ "\r\n"
        		+ "                            <p style=\"font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 30px;\">\r\n"
        		+ "                                요청하신 본인 인증을 위해 아래의 6자리 코드를 화면에 입력해 주세요.\r\n" // 닉네임 제거 및 문구 변경
        		+ "                            </p>\r\n"
        		+ "                            \r\n"
        		+ "                            \r\n"
        		+ "                            <div class=\"code-box\" style=\"font-size: 32px;\">\r\n"
        		+ "                                <span>"+verifiCode+"</span>\r\n"
        		+ "                            </div>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "                    \r\n"
        		+ "                    <tr>\r\n"
        		+ "                        <td style=\"padding: 0 40px 40px;\">\r\n"
        		+ "                            <div style=\"border-top: 1px solid #eeeeee; padding-top: 20px; text-align: left;\">\r\n" // 왼쪽 정렬 복구
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #777777; margin-bottom: 10px;\">\r\n"
        		+ "                                    <strong>[유효 시간 안내]</strong> 보안을 위해 이 인증 코드는 발송 시점으로부터 **5분** 동안만 유효합니다. 시간이 초과된 경우, 인증 코드를 다시 요청해 주세요.\r\n" // 5분으로 변경
        		+ "                                </p>\r\n"
        		+ "                                <p style=\"font-size: 14px; line-height: 1.6; color: #cc0000; margin-bottom: 0;\">\r\n"
        		+ "                                    <strong>[안전 경고]</strong> **본인이 인증을 요청하지 않았다면,** 이 메일을 즉시 무시하고 삭제해 주십시오.\r\n" // 문구 수정
        		+ "                                </p>\r\n"
        		+ "                            </div>\r\n"
        		+ "                        </td>\r\n"
        		+ "                    </tr>\r\n"
        		+ "\r\n"
        		+ "                </table>\r\n"
        		+ "            </td>\r\n"
        		+ "        </tr>\r\n"
        		+ "    </table>\r\n"
        		+ "\r\n"
        		+ "</body>\r\n"
        		+ "</html>";
		emailService.sendEmail(email, subject, content);
	}
	
	private void applyResendRateLimit(String email) {
		
		// 특정 이메일 주소에 대해 1분(60초) 동안 최대 3회만 인증 코드를 재전송할 수 있도록 제한	
		String limitKey = "resend_limit:" + email; // Redis에 저장할 Key (예: resend_limit:user@example.com)
		String failCountKey = "FAIL_COUNT:" + email;
		ValueOperations<String, String> valueOperations = redisTemplate.opsForValue(); // String 타입의 값을 다루는 Redis Operations 객체

		String countStr = valueOperations.get(limitKey); // Redis에서 현재 재전송 시도 횟수를 문자열로 가져옴 (Key가 없으면 null)

		// 1. 재전송 횟수 확인 및 제한
		if (countStr != null && Integer.parseInt(countStr) >= 3) {
		    // 현재 횟수가 3회 이상일 경우 (1분 윈도우 내 4번째 시도)
		    // 커스텀 예외를 던져 요청을 거부하고, 사용자에게 횟수 제한 초과 메시지를 반환함
		    throw new CustomException(ErrorCode.VERIFICATION_CODE_RESEND_LIMIT);
		}

		// 2. 카운트 초기화 또는 증가
		if (countStr == null) {
		    // Redis에 Key가 존재하지 않는 경우 (1분 윈도우 내 첫 번째 시도)
		    // Key를 '1'로 설정하고, 1분(60초)의 만료 시간(TTL)을 지정함
		    // 이 TTL이 만료되면 Key가 자동으로 삭제되어, 1분 후에는 다시 첫 시도로 간주됨
		    valueOperations.set(limitKey, "1", Duration.ofMinutes(1));
		} else {
		    // Redis에 Key가 이미 존재하는 경우 (1분 윈도우 내 2~3번째 시도)
		    // 현재 카운트를 1 증가시킴 (TTL은 기존 Key의 만료 시간을 그대로 유지함)
		    valueOperations.increment(limitKey);
		}
		
		// 실패 횟수 초기화
		valueOperations.set(failCountKey, "0", Duration.ofMinutes(5));
	}
	
	// resendVerificationCode
	public void resendVerificationCode(String email) {
	    applyResendRateLimit(email); // Rate Limit 체크 및 카운트 증가
	    requestNewEmailVerifiCode(email); // 인증 코드 생성 및 이메일 전송
	}

	// requestEmailChangeVerification
	public void requestEmailChangeVerification(String email) {
	    applyResendRateLimit(email); // Rate Limit 체크 및 카운트 증가
	    requestNewEmailVerifiCode(email); // 인증 코드 생성 및 이메일 전송
	}

	public boolean verifyVerificationCode(String email, String verificationCode) {
		ValueOperations<String, String> valueOperations = redisTemplate.opsForValue();
		String authCodeKey = "AUTH_CODE:" + email;
		String failCountKey = "FAIL_COUNT:" + email;

		// 1. 실패 횟수 조회
		String failCountStr = valueOperations.get(failCountKey);
		int failCount = (failCountStr != null) ? Integer.parseInt(failCountStr) : 0;

		// 2. 5회 제한 검사
		if (failCount >= 4) {
			throw new CustomException(ErrorCode.VERIFICATION_CODE_FAILURE_LIMIT);
		}

		// 3. 인증 코드 검증
		String storedCode = valueOperations.get(authCodeKey);
		if (storedCode == null) {
			throw new CustomException(ErrorCode.VERIFICATION_CODE_EXPIRED);
		}

		// 4. 불일치 처리
		if (!storedCode.equals(verificationCode)) {
			// 실패 횟수 증가 및 TTL 설정
			valueOperations.increment(failCountKey);
			redisTemplate.expire(failCountKey, Duration.ofMinutes(5));
			throw new CustomException(ErrorCode.VERIFICATION_CODE_MISMATCH);
		}

		// 5. 일치 및 성공 처리
		redisTemplate.delete(authCodeKey);
		redisTemplate.delete(failCountKey);

		return true;
	}
}
