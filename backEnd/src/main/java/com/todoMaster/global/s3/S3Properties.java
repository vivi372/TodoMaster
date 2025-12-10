package com.todoMaster.global.s3;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AWS S3 서비스 연결에 필요한 설정값들을 주입받는 Configuration Properties 클래스입니다.
 * application.yml/properties 파일의 'aws' 접두사 아래의 설정을 매핑합니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "aws") // 설정 파일의 'aws' 접두사 아래의 속성과 매핑
public class S3Properties {

    // 'aws.s3' 접두사의 하위 속성을 매핑하는 내부 클래스
    private S3 s3;
    
    // 'aws.credentials' 접두사의 하위 속성을 매핑하는 내부 클래스
    private Credentials credentials;

    /**
     * 'aws.s3' 설정 블록을 나타내는 내부 정적 클래스입니다.
     */
    @Getter @Setter
    public static class S3 {
        // aws.s3.bucket 에 매핑 (S3 버킷 이름)
        private String bucket;
        
        // aws.s3.region 에 매핑 (AWS 리전 코드, 예: ap-northeast-2)
        private String region;
    }

    /**
     * 'aws.credentials' 설정 블록을 나타내는 내부 정적 클래스입니다.
     * AWS 자격 증명 정보를 포함합니다. (EC2 Role 사용 시에는 이 필드를 사용하지 않음)
     */
    @Getter @Setter
    public static class Credentials {
        // aws.credentials.accessKey 에 매핑 (액세스 키 ID)
        private String accessKey;
        
        // aws.credentials.secretKey 에 매핑 (비밀 액세스 키)
        private String secretKey;
    }

    // 편의를 위해 최상위 클래스에서 하위 필드에 직접 접근하는 Getter 메서드
    
    /** 버킷 이름을 반환합니다. */
    public String getBucket() { return this.s3.bucket; }
    
    /** 리전 코드를 반환합니다. */
    public String getRegion() { return this.s3.region; }
    
    /** 액세스 키 ID를 반환합니다. */
    public String getAccessKey() { return this.credentials.accessKey; }
    
    /** 비밀 액세스 키를 반환합니다. */
    public String getSecretKey() { return this.credentials.secretKey; }
}