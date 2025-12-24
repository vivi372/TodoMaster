package com.todoMaster.auth.service;

import org.springframework.stereotype.Service;

import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.email.service.EmailService;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.vo.UserInfoVO;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VerificationService {
	
    private final EmailService emailService;   
    private final JwtProvider jwtProvider;

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
     * 인증 토큰 검증후 이메일 / userId 반환 하는 함수
     * @param token 사용자로 부터 받은 인증 토큰
     */
    public UserInfoVO extractClaimsFromToken(String token) {
    	UserInfoVO user = new UserInfoVO();
    	
    	// 1. 토큰 기본 검증
    	 if (!jwtProvider.validateToken(token)) {
             throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
         }

    	try {
    		// 2. 토큰에서 이메일 / userId 꺼내기
    		String email = jwtProvider.getEmail(token);
    		Long userId = jwtProvider.getUserId(token);
    		
    		// 3. 꺼낸값 user에 저장
    		user.setEmail(email);
    		user.setUserId(userId);
    	} catch (JwtException | IllegalArgumentException e) {
    		throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
		}    	 
    	
    	
    	return user;
    	
    }
   
}
