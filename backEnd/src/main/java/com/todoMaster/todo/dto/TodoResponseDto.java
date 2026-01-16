package com.todoMaster.todo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.todoMaster.repeat.vo.RepeatVO;
import com.todoMaster.todo.vo.TodoVO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.LocalDate;
import java.util.Date;

/**
 * Todo 조회 결과를 클라이언트에 반환하기 위한 DTO (Data Transfer Object) 입니다.
 * 데이터베이스의 TodoVO 객체를 클라이언트 친화적인 형태로 변환하는 데 사용됩니다.
 */
@Getter
@Builder
@AllArgsConstructor
@ToString
public class TodoResponseDto {

    /**
     * Todo 항목의 고유 ID
     */
    private Long todoId;

    /**
     * Todo를 소유한 사용자의 고유 ID
     */
    private Long userId;

    /**
     * Todo 항목의 제목
     */
    private String title;

        /**
         * Todo 항목의 상세 설명
         */
        private String memo;
    
        /**
         * 우선순위. (0: 낮음, 1: 보통, 2: 높음)
         * DB의 PRIORITY 컬럼 값을 그대로 전달합니다.
         */
        private Integer priority;
    
        /**
         * Todo 항목의 완료 여부 ('Y' 또는 'N')
         */
        private String isCompleted;
    
        /**
         * Todo 항목의 마감 기한 (시간 정보 없음)
         */
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate dueDate;
    
        /**
         * Todo 항목의 생성 일시
         */
        private Date createdAt;
    
        /**
         * Todo 항목의 마지막 수정 일시
         */
        private Date updatedAt;

    /**
     * 이 Todo와 연관된 반복 규칙 정보.
     * 반복 설정이 없는 경우 null이 됩니다.
     */
    private RepeatVO repeatVO;
    
        /**
         * TodoVO 객체를 TodoResponseDto 객체로 변환하는 정적 팩토리 메서드입니다.
         * 이 메서드는 서비스 계층에서 데이터베이스 엔티티를 DTO로 변환할 때 사용됩니다.
         * @param vo 변환할 TodoVO 객체
         * @return 변환된 TodoResponseDto 객체
         */
        public static TodoResponseDto from(TodoVO vo) {
            if (vo == null) {
                return null;
            }
            return TodoResponseDto.builder()
                    .todoId(vo.getTodoId())
                    .userId(vo.getUserId())
                    .title(vo.getTitle())
                    .memo(vo.getMemo())
                    .priority(vo.getPriority()) // priority 필드 추가
                    // isCompleted 필드는 이제 'Y'/'N' 문자열 값을 그대로 사용합니다.
                    .isCompleted(vo.getIsCompleted())
                    .dueDate(vo.getDueDate())
                    .createdAt(vo.getCreatedAt())
                    .updatedAt(vo.getUpdatedAt())
                    .repeatVO(vo.getRepeatVO()) // repeatVO 필드 추가
                    .build();
        }
    }
