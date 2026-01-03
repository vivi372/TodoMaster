package com.todoMaster.common.service;

import java.net.URL;
import java.time.Duration;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;

import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * AWS S3에 파일을 직접 업로드할 수 있도록 '미리 서명된 URL (Presigned URL)'을 생성하는 서비스 클래스.
 * 이를 통해 백엔드 서버를 거치지 않고 프론트엔드에서 S3로 바로 파일을 업로드할 수 있게 합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    // S3 Presigner 클라이언트: 미리 서명된 URL을 생성하는 핵심 객체입니다.
    private final S3Presigner s3Presigner;
    private final S3Client s3Client;

    // application.yml 또는 환경 변수에서 S3 버킷 이름을 주입받습니다.
    @Value("${aws.s3.bucket}")
    private String bucket;

    /**
     * S3에 파일을 업로드하기 위한 미리 서명된 URL과 파일 경로(Object Key)를 생성합니다.
     *
     * @param directory 업로드할 파일이 위치할 S3 버킷 내의 디렉토리 경로 (예: "profile-images")
     * @param contentType 업로드할 파일의 MIME 타입 (예: "image/jpeg", "application/pdf")
     * @return 생성된 URL과 S3 객체 키를 포함하는 PresignResult 레코드
     */
    public PresignResult generatePutUrl(String directory, String contentType) {
    	
        // 1. 고유한 파일 이름 생성: 파일명 중복을 피하기 위해 UUID를 사용합니다.
        String fileName = UUID.randomUUID().toString();
        // 2. S3 객체 키 (Object Key) 생성: 디렉토리 경로와 파일 이름을 결합합니다.
        String objectKey = directory + "/" + fileName;
        try {
	        // 3. PutObjectRequest 생성: S3에 업로드될 객체의 기본 정보를 설정합니다.
	        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
	                .bucket(bucket)             // 대상 S3 버킷 이름
	                .key(objectKey)             // S3 버킷 내의 파일 경로 및 이름
	                .contentType(contentType)   // 업로드할 파일의 MIME 타입 명시
	                .build();
	
	        // 4. PutObjectPresignRequest 생성: 미리 서명된 URL 생성 요청 정보를 설정합니다.
	        PutObjectPresignRequest presignRequest =
	                PutObjectPresignRequest.builder()
	                        // 서명 유효 시간 설정: 5분 동안만 이 URL을 사용하여 업로드가 가능합니다.
	                        .signatureDuration(Duration.ofMinutes(5))
	                        // 미리 서명할 PutObject 요청 정보를 연결합니다.
	                        .putObjectRequest(putObjectRequest)
	                        .build();
	        // 5. Presigned URL 생성: S3 Presigner를 사용하여 최종 URL을 얻습니다.
	        URL url = s3Presigner.presignPutObject(presignRequest).url();
	        
	        // 6. 결과 반환: 프론트엔드에서 사용할 URL 문자열과 백엔드에서 추적할 객체 키를 반환합니다.
	        return new PresignResult(url.toString(), objectKey);
	        
        } catch (Exception e) {
        	// 로그는 반드시 남긴다
            log.error("Presigned URL generation failed. key={}", objectKey, e);

            // 사용자에게는 추상화된 에러만 전달
            throw new CustomException(ErrorCode.PRESIGNED_URL_GENERATION_FAILED);
		}

    }
    
    /**
     * 오브젝트 키(key)에 대해 만료 시간이 설정된 GET 요청용 Presigned URL을 생성합니다.
     * 이 URL을 가진 사람은 해당 만료 시간 동안 S3에 직접 접근하여 객체를 다운로드하거나 조회할 수 있습니다.
     *
     * @param key S3 버킷 내의 파일 경로 및 이름
     * @return 생성된 Presigned URL 문자열
     */
    public String generateGetUrl(String key) {
        // 1. S3 GetObject 요청 객체 생성 (어떤 객체에 접근할지 정의)
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket) // 접근할 S3 버킷 이름 설정
                .key(key)       // 접근할 객체의 키(경로) 설정
                .build();

        // 2. Presign 요청 객체 생성 (Presigned URL의 조건 정의)
        GetObjectPresignRequest presignRequest =
                GetObjectPresignRequest.builder()
                        // 서명 유효 시간 설정: 5분 동안 유효한 URL을 생성
                        .signatureDuration(Duration.ofMinutes(5))                        
                        // 1단계에서 만든 GetObjectRequest 객체를 포함시킵니다.
                        .getObjectRequest(getObjectRequest)
                        .build();

        // 3. Presigner를 사용하여 최종 Presigned URL 요청 객체 생성
        PresignedGetObjectRequest presignedRequest =
        		s3Presigner.presignGetObject(presignRequest);

        // 4. 생성된 Presigned URL의 문자열 형태를 반환
        return presignedRequest.url().toString();
    }
    
    /**
     * S3 객체 이동
     * S3에는 move API가 없으므로
     * 1. copy
     * 2. delete
     * 순서로 처리
     * @param sourceKey 이동할 원본 object key
     * @param targetKey 이동될 object key
     */
    public void move(String sourceKey, String targetKey) {
    	try {
	        // 1. COPY
	        CopyObjectRequest copyRequest = CopyObjectRequest.builder()
	                .sourceBucket(bucket)
	                .sourceKey(sourceKey)
	                .destinationBucket(bucket)
	                .destinationKey(targetKey)
	                .build();
	
	        s3Client.copyObject(copyRequest);
	
	        // 2. DELETE (copy 성공 후)
	        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
	                .bucket(bucket)
	                .key(sourceKey)
	                .build();
	
	        s3Client.deleteObject(deleteRequest);
    	} catch (Exception e) {
    		 // 내부 에러이므로 상세 로그 필수
            log.error("S3 move failed. source={}, target={}", sourceKey, targetKey, e);

            // 사용자에게는 내부 처리 실패로만 전달
            throw new CustomException(ErrorCode.FILE_MOVE_FAILED);
		}
    }
    
    /**
     * AWS S3 버킷에서 지정된 객체(파일)를 삭제합니다.
     * 이 메서드는 주로 파일 이동(Copy-Delete) 로직의 최종 단계에서 원본 파일을 삭제하거나,
     * 사용자 파일 삭제 요청 시 해당 객체를 제거하는 데 사용됩니다.
     * * @param objectKey S3 버킷 내에서 삭제할 객체의 고유 키 (예: 'path/to/filename.jpg').
     * @throws CustomException S3 통신 오류 또는 삭제 실패와 같은 내부 오류 발생 시 
     * ErrorCode.FILE_MOVE_FAILED 예외를 발생시키고 상세 로그를 남깁니다.
     */
    public void delete(String objectKey) {
        try {
            // 1. [S3 객체 삭제 요청 빌드]
            // 삭제할 버킷 이름(bucket)과 객체 키(objectKey)를 설정하여 요청 객체를 생성합니다.
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket) // S3 버킷 이름
                    .key(objectKey)  // 버킷 내 파일 경로 (Object Key)
                    .build();

            // 2. [S3 객체 삭제 실행]
            s3Client.deleteObject(deleteRequest);
            
            // * 주석: 삭제 성공 시 별도의 반환 값 없이 메서드 종료
        } catch (Exception e) {
            // [예외 처리] S3 클라이언트 통신 중 발생하는 모든 예외를 포착합니다.
            
            // 내부 에러이므로 상세 로그 필수
            // 에러 발생한 객체 키와 스택 트레이스를 로그에 남깁니다.
            log.error("S3 delete failed. object={}", objectKey ,e);

            // 사용자에게는 내부 처리 실패로만 전달
            // FILE_MOVE_FAILED 코드를 사용하여 사용자에게는 일반적인 처리 실패 메시지를 반환합니다.
            throw new CustomException(ErrorCode.FILE_MOVE_FAILED);
        }
    }
    
    /**
     * 문자열의 가장 앞에 있는 "S3:" 접두사를 제거합니다.
     * @param originalString 원본 문자열
     * @return 접두사가 제거된 문자열. 접두사가 없으면 원본 문자열을 반환합니다.
     */
    public String removeS3Prefix(String originalString) {
        if (originalString == null || originalString.isEmpty()) {
            return originalString; // null 또는 빈 문자열은 그대로 반환
        }

        final String prefix = "S3:";
        
        // 1. 문자열이 "S3:"로 시작하는지 확인
        if (originalString.startsWith(prefix)) {
            // 2. 접두사("S3:")의 길이만큼 잘라내고 나머지 문자열을 반환
            // prefix.length() = 3
            return originalString.substring(prefix.length());
        }

        // 3. 접두사가 없으면 원본 문자열 그대로 반환
        return originalString;
    }

    /**
     * Presigned URL과 S3 객체 키(Object Key)를 담는 레코드 클래스입니다.
     * 레코드는 불변(Immutable) 데이터 전달 객체(DTO)로 사용하기에 적합합니다.
     *
     * @param url 프론트엔드가 파일을 PUT 요청할 미리 서명된 URL
     * @param objectKey S3 버킷에 저장될 파일의 전체 경로
     */
    public record PresignResult(String url, String objectKey) {}
}