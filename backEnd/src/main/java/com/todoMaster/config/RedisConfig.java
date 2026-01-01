package com.todoMaster.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 통합 설정 클래스.
 * 이 클래스는 Spring 애플리케이션과 Redis 서버 간의 연동을 설정
 */
@Configuration
public class RedisConfig {

    // Redis 호스트 정보를 주입받습니다.
    @Value("${spring.data.redis.host}")
    private String host;

    // Redis 포트 정보를 주입받습니다.
    @Value("${spring.data.redis.port}")
    private int port;

    /**
     * Redis 연결 팩토리를 생성하고 구성하는 Bean.
     * Lettuce는 고성능, 논블로킹 I/O를 지원하는 Redis 클라이언트로,
     * Redis 서버(host, port)와의 연결을 설정합니다.
     * @return {@link RedisConnectionFactory}의 Lettuce 구현체
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(host, port);
    }

    /**
     * Redis 데이터 작업을 위한 핵심 도구인 {@link RedisTemplate}을 구성하는 Bean.
     * <p>
     * 이 템플릿은 Redis에 데이터를 저장하고 조회하는 작업을 추상화하여 편리한 API를 제공합니다.
     * Key와 Value의 직렬화(Serialization) 방식을 설정하여, Java 객체가 Redis에 어떤 형태로 저장될지 결정합니다.
     * </p>
     * @return {@link String} 타입의 Key와 Value를 처리하도록 구성된 {@link RedisTemplate}
     */
    @Bean
    public RedisTemplate<String, String> redisTemplate() {
        RedisTemplate<String, String> redisTemplate = new RedisTemplate<>();
        
        // 생성된 RedisConnectionFactory를 RedisTemplate에 설정하여 실제 서버와 통신할 수 있도록 합니다.
        redisTemplate.setConnectionFactory(redisConnectionFactory());

        // Key 직렬화 방식으로 StringRedisSerializer를 설정합니다.
        // 이는 Redis의 Key를 UTF-8 인코딩된 문자열로 저장하여, 가독성을 높이고 디버깅을 용이하게 합니다.
        redisTemplate.setKeySerializer(new StringRedisSerializer());

        // Value 직렬화 방식으로 StringRedisSerializer를 설정합니다.
        // 이메일 인증 코드와 같이 단순한 문자열 값을 저장하는 경우, 이 방식이 가장 직관적이고 효율적입니다.
        // TTL(Time-To-Live)이 설정된 데이터도 이 직렬화 방식을 통해 문제없이 관리됩니다.
        redisTemplate.setValueSerializer(new StringRedisSerializer());
        
        return redisTemplate;
    }
}
