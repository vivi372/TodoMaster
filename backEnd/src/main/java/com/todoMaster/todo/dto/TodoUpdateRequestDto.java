package com.todoMaster.todo.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * Todo 수정을 위한 요청 데이터를 담는 DTO (Data Transfer Object) 입니다.
 * PATCH 연산을 지원하기 위해 모든 필드는 선택적(Optional)으로, 값이 제공된 필드만 업데이트됩니다.
 * 각 필드에 대한 유효성 검사 규칙이 정의되어 있습니다.
 */
@Getter
@Setter
public class TodoUpdateRequestDto {

    /**
     * 새로 수정할 Todo 항목의 제목입니다.
     */
    // @Size: 문자열의 길이가 지정된 최대값을 초과하지 않는지 확인합니다.
    @Size(max = 100, message = "제목은 100자를 초과할 수 없습니다.")
    private String title;

    /**
     * 새로 수정할 Todo 항목의 상세 설명입니다.
     */
    // @Size: 문자열의 길이가 지정된 최대값을 초과하지 않는지 확인합니다.
    @Size(max = 500, message = "메모는 500자를 초과할 수 없습니다.")
    private String memo;

    /**
     * Todo 항목의 완료 여부입니다. ('Y': 완료, 'N': 미완료)
     */
    // @Pattern: 'Y' 또는 'N' 문자만 허용하는 정규식 검사
    @Pattern(regexp = "[YN]", message = "완료 여부는 'Y' 또는 'N' 값만 가능합니다.")
    private String isCompleted;

    /**
     * 새로 수정할 Todo 항목의 마감 기한입니다.
     */
    // @FutureOrPresent: 날짜와 시간이 현재 또는 미래인지 확인합니다.
    @FutureOrPresent(message = "마감 기한은 현재 또는 미래의 날짜여야 합니다.")
    private Date dueDate;
}
