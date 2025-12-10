package com.todoMaster.global.s3;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * AWS S3에 파일을 업로드하는 기능을 담당하는 컴포넌트입니다.
 * 설정 파일(S3Properties)로부터 자격 증명을 받아 S3Client를 생성하고 파일을 업로드합니다.
 */
@Component
@RequiredArgsConstructor
public class S3Uploader {

    // S3 연결 정보를 담고 있는 설정 클래스를 주입받습니다.
    private final S3Properties properties;

    /**
     * S3Client 인스턴스를 생성하고 반환합니다.
     * 이 메서드는 S3Properties에서 Access Key와 Secret Key를 직접 사용하여 클라이언트를 구성합니다.
     * @return 설정된 S3Client 객체
     */
    private S3Client getClient() {
        return S3Client.builder()
                // 1. AWS 리전을 설정합니다.
                .region(Region.of(properties.getRegion()))
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                // 2. Access Key와 Secret Key를 사용하여 자격 증명 공급자를 생성합니다. (키 하드코딩 방식)
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        properties.getAccessKey(),
                                        properties.getSecretKey()
                                )
                        )
                )
                .build();
    }

    /**
     * MultipartFile을 S3의 지정된 폴더에 업로드합니다.
     *
     * @param file 업로드할 파일 (MultipartFile)
     * @param folder S3 버킷 내의 저장 경로 (예: "images", "videos")
     * @return 업로드된 파일의 S3 URL
     * @throws RuntimeException S3 업로드 중 예외 발생 시
     */
    public String upload(MultipartFile file, String folder) {
        try {
            // 1. 파일 이름 생성: 폴더 경로 + 타임스탬프 + 원본 파일 이름을 조합하여 파일명을 유일하게 만듭니다.
            String fileName = folder + "/" +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + "_" + file.getOriginalFilename();

            // 2. S3Client 객체를 가져옵니다.
            S3Client s3 = getClient();

            // 3. PutObjectRequest (업로드 요청) 객체를 생성합니다.
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(properties.getBucket())  // 대상 버킷 이름 설정
                    .key(fileName)                   // S3에 저장될 파일 경로 및 이름 설정
                    .contentType(file.getContentType()) // 파일 타입 설정 (브라우저 접근 시 필요)
                    .build();

            // 4. 파일을 S3에 업로드합니다.
            //    RequestBody.fromInputStream을 사용하여 파일의 입력 스트림과 크기를 전달합니다.
            s3.putObject(request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // 5. 업로드된 파일의 공개 접근 URL을 생성하여 반환합니다.
            return "https://" + properties.getBucket() + ".s3." +
                    properties.getRegion() + ".amazonaws.com/" + fileName;

        } catch (Exception e) {
            // 업로드 중 발생한 모든 예외를 RuntimeException으로 감싸서 처리합니다.
            throw new RuntimeException("S3 업로드 실패: " + e.getMessage());
        }
    }
}
