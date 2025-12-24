package com.todoMaster.email.service;

import java.nio.charset.StandardCharsets;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
	
	private final JavaMailSender mailSender;
	
	// 네이버 ID (application.yml에서 설정된 username)
    // 네이버 SMTP는 발신 이메일 주소를 이 ID와 동일하게 설정하도록 강제함
    private final String senderEmail = "ym970825@naver.com";
    private final String displayName = "HaruLog";
	
	/**
     * 이메일을 발송하는 메서드
     * @param to 수신자 이메일 주소
     * @param subject 이메일 제목
     * @param text 이메일 내용 (본문)
     */
	public void sendEmail(String to, String subject, String text) {
        try {
        	MimeMessage message = mailSender.createMimeMessage();
            
            // MimeMessageHelper를 사용하여 제목, 내용, 발신자 이름 등 설정
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            
            // 네이버 SMTP는 발신 이메일 주소(senderEmail)가 인증 ID와 일치해야 합니다.
            // 이름만 displayName으로 표시됩니다.
            helper.setFrom(senderEmail, displayName);
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true);

            mailSender.send(message);
            log.info("이메일 발송 성공: DisplayName={}, To={}", displayName, to);
            
        } catch (Exception e) {
            log.error("이메일 발송 실패: To={}, Error={}", to, e.getMessage());
            throw new CustomException(ErrorCode.EMAIL_SENDING_FAILURE);
        }
    }
}
