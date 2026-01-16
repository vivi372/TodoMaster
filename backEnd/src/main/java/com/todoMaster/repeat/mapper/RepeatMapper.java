package com.todoMaster.repeat.mapper;

import com.todoMaster.repeat.vo.RepeatVO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface RepeatMapper {
    void insertRepeatRule(RepeatVO repeatVO);
    Optional<RepeatVO> findRepeatRuleById(Long repeatRuleId);
    void updateRepeatRule(RepeatVO repeatVO);
    void deleteRepeatRule(Long repeatRuleId);
}

