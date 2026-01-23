package com.todoMaster.repeat.mapper;

import com.todoMaster.repeat.vo.RepeatVO;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Mapper
public interface RepeatMapper {
    void insertRepeatRule(RepeatVO repeatVO);
    Optional<RepeatVO> findRepeatRuleById(Long repeatRuleId);
    void updateRepeatRule(RepeatVO repeatVO);
    void deleteRepeatRule(Long repeatRuleId);

    /**
     * 배치 작업을 위해 활성 상태인 모든 반복 규칙을 조회합니다.
     * 활성 상태: 종료일이 없거나(NULL), 종료일이 오늘 날짜 이후인 경우
     * @param today 오늘 날짜
     * @return 활성 반복 규칙 목록
     */
    List<RepeatVO> findAllActiveRules(LocalDate today);

    /**
     * 어떤 Todo 항목과도 연결되지 않은 '고아 반복 규칙'을 삭제합니다.
     * @return 삭제된 행의 수
     */
    int deleteOrphanedRules();
}

