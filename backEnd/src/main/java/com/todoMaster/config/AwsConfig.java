package com.todoMaster.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import org.springframework.beans.factory.annotation.Value;


@Configuration
public class AwsConfig {

    // application.yml에서 설정 값 주입
    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.credentials.accessKey}")
    private String accessKey;

    @Value("${aws.credentials.secretKey}")
    private String secretKey;

    /**
     * S3Presigner 빈을 등록합니다.
     * Presigner는 AWS API 호출을 수행하기 위해 자격 증명과 리전 정보가 필요합니다.
     */
    @Bean
    public S3Presigner s3Presigner() {
        // 1. 자격 증명 설정
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        // 2. Presigner 객체 빌드 및 반환
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
    
    /**
     * S3Client 빈을 등록합니다.
     * S3와의 직접적인 통신(삭제, 다운로드 등)에 사용됩니다.
     */
    @Bean
    public S3Client s3Client() {
        // Presigner와 동일하게 자격 증명과 리전 정보를 설정합니다.
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
    }
}
