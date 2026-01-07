package com.todoMaster.todo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * Todo 생성을 위한 요청 데이터를 담는 DTO (Data Transfer Object) 입니다.
 * 각 필드에 대한 유효성 검사 규칙이 정의되어 있습니다.
 */
@Getter
@Setter
public class TodoCreateRequestDto {

    /**
     * Todo 항목의 제목입니다. (예: "장보기")
     */
    // @NotBlank: 해당 필드가 null이 아니고, 공백 문자만으로 이루어져 있지 않은지 확인합니다.
    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    // @Size: 문자열의 길이가 지정된 최대값을 초과하지 않는지 확인합니다.
    @Size(max = 100, message = "제목은 100자를 초과할 수 없습니다.")
    private String title;

    /**
     * Todo 항목의 상세 설명입니다. (예: "우유, 계란, 빵 사기")
     */
    // @Size: 문자열의 길이가 지정된 최대값을 초과하지 않는지 확인합니다.
    @Size(max = 500, message = "메모는 500자를 초과할 수 없습니다.")
    private String memo;

    /**
     * Todo 항목의 마감 기한입니다.
     */
    // @FutureOrPresent: 날짜와 시간이 현재 또는 미래인지 확인합니다.
    @FutureOrPresent(message = "마감 기한은 현재 또는 미래의 날짜여야 합니다.")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dueDate;

    /**
     * Todo 항목의 우선순위입니다. (0: 낮음, 1: 보통, 2: 높음)
     */
    // @Min: 필드 값이 지정된 최소값 이상인지 확인합니다.
    @Min(value = 0, message = "우선순위는 0보다 작을 수 없습니다.")
    // @Max: 필드 값이 지정된 최대값 이하인지 확인합니다.
    @Max(value = 2, message = "우선순위는 2보다 클 수 없습니다.")
    private Integer priority;
}
