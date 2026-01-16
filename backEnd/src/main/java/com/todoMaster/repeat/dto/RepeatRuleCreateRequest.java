package com.todoMaster.repeat.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * 반복 규칙 생성을 위한 API 요청을 담는 DTO(Data Transfer Object) 클래스.
 * 클라이언트로부터 `POST /api/repeat/todos/{todoId}` 요청을 받을 때 사용됩니다.
 */
@Getter
@Setter
public class RepeatRuleCreateRequest {
    /**
     * 반복 타입 (DAILY, WEEKLY, MONTHLY)
     */
    private String type;

    /**
     * 반복 간격 (예: 2일마다, 3주마다)
     * 기본값은 1입니다.
     */
    private Integer intervalValue;

    /**
     * 반복 요일 (WEEKLY 타입에서 사용, 쉼표로 구분된 문자열)
     * 예: "MON,TUE,WED"
     */
    private String weekDays;

    /**
     * 반복 종료일. 이 날짜 이후로는 반복 일정이 생성되지 않습니다.
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
}
