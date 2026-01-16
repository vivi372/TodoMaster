package com.todoMaster.repeat.vo;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

/**
 * Todo 반복 규칙 정보를 담는 VO (Value Object) 클래스.
 * 데이터베이스의 TODO_REPEAT_RULE 테이블과 매핑됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepeatVO {

    /**
     * 반복 규칙의 고유 ID (PK)
     */
    private Long repeatRuleId;

    /**
     * 반복 타입 (DAILY, WEEKLY, MONTHLY)
     */
    private String type;

    /**
     * 반복 간격 (예: 2일마다, 3주마다)
     */
    private Integer intervalValue;

    /**
     * 반복 요일 (WEEKLY 타입에서 사용, 쉼표로 구분된 문자열)
     * 예: "MON,TUE,WED"
     */
    private String weekDays;

    /**
     * 반복 종료일
     */
    private LocalDate endDate;

    /**
     * 생성 일시
     */
    private LocalDate createdAt;
}
