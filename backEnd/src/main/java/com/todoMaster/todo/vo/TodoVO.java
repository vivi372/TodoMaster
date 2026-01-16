package com.todoMaster.todo.vo;

import java.time.LocalDate;
import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.todoMaster.repeat.vo.RepeatVO;
import lombok.ToString;

/**
 * Todo 항목의 데이터 전송을 담당하는 VO(Value Object) 클래스.
 * 이 클래스는 데이터베이스의 TODO 테이블과 매핑됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class TodoVO {
    /**
     * Todo 항목의 고유 식별자 (Primary Key).
     * DB의 TODO_ID에 해당합니다.
     */
    private Long todoId;

    /**
     * Todo 항목을 생성한 사용자의 고유 식별자 (Foreign Key).
     * DB의 USER_ID에 해당합니다.
     */
    private Long userId;
    
    /**
     * 카테고리 ID.
     * DB의 CATEGORY_ID에 해당합니다.
     */
    private Long categoryId;

    /**
     * Todo 항목의 제목.
     * DB의 TITLE에 해당합니다.
     */
    private String title;

    /**
     * Todo 항목의 메모.
     * DB의 MEMO에 해당합니다.
     */
    private String memo;

    /**
     * 우선순위.
     * DB의 PRIORITY에 해당합니다.
     */
    private Integer priority;

    /**
     * Todo 항목의 완료 여부. ('Y': 완료, 'N': 미완료)
     * DB의 IS_COMPLETED 컬럼(VARCHAR(1))에 해당하며, 'Y' 또는 'N' 값을 가집니다.
     */
    private String isCompleted;

    /**
     * Todo 항목의 마감 기한. 시간 정보는 포함하지 않음.
     * DB의 DUE_DATE에 해당합니다.
     */
    private LocalDate dueDate;
    
    /**
     * 반복 규칙 ID.
     * DB의 REPEAT_RULE_ID에 해당합니다.
     */
    private Long repeatRuleId;

    /**
     * TODO와 조인된 반복 규칙 정보를 담는 객체.
     * MyBatis의 resultMap을 통해 채워집니다.
     */
    private RepeatVO repeatVO;

    /**
     * 완료 처리 일시.
     * DB의 COMPLETED_AT에 해당합니다.
     */
    private Date completedAt;

    /**
     * Todo 항목의 생성 일시.
     * DB의 CREATED_AT에 해당합니다.
     */
    private Date createdAt;

    /**
     * Todo 항목의 마지막 수정 일시.
     * DB의 UPDATED_AT에 해당합니다.
     */
    private Date updatedAt;
}
