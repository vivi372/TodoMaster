import { api } from '@/shared/lib/api/axios';
import type { ApiResponse } from '@/shared/types/api';

// ============================
// Interfaces and Types
// ============================

/**
 * @description 반복 규칙 생성을 위한 요청 데이터 타입.
 * 백엔드의 `RepeatRuleCreateRequest` DTO와 일치합니다.
 */
export interface RepeatRuleCreateRequest {
  /**
   * @description 반복 타입 ('DAILY', 'WEEKLY', 'MONTHLY')
   */
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  /**
   * @description 반복 간격 (예: 2일마다, 3주마다). 기본값은 1입니다.
   */
  intervalValue?: number;
  /**
   * @description 반복 요일 (WEEKLY 타입에서 사용, 쉼표로 구분된 문자열).
   * 예: "MON,TUE,WED"
   */
  weekDays?: string;
  /**
   * @description 반복 종료일. 이 날짜 이후로는 반복 일정이 생성되지 않습니다. 'YYYY-MM-DD' 형식.
   */
  endDate?: string;
}

// ============================
// API Functions
// ============================

const REPEAT_API_URL = '/api/repeat';

/**
 * @description 반복(Repeat) 관련 API 요청을 처리하는 객체.
 * 이 파일은 `RepeatController`에 정의된 API들을 따릅니다.
 */
export const repeatApi = {
  /**
   * @summary **기존 Todo에 새로운 반복 규칙 생성 API**
   * @description 이미 존재하는 Todo 항목에 새로운 반복 규칙을 설정합니다.
   * 이 API가 호출되면, 해당 Todo는 반복 시리즈의 '원본'이 되며,
   * 요청된 규칙에 따라 향후의 반복 일정들이 자동으로 생성됩니다.
   * @param {number} todoId - 반복 규칙을 적용할 Todo의 고유 ID
   * @param {RepeatRuleCreateRequest} payload - 생성할 반복 규칙의 상세 정보
   * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
   * @throws {ApiResponse} API 요청 실패 시 에러 응답 객체
   */
  createRepeatRuleForTodo: async (todoId: number, payload: RepeatRuleCreateRequest): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`${REPEAT_API_URL}/todos/${todoId}`, payload);

    if (response.status === 200 || (response.data && response.data.success)) {
      return;
    }

    if (!response.data.success) {
      throw response.data;
    }
  },
};