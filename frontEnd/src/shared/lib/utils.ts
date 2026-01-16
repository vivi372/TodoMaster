import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfToday } from 'date-fns'; // date-fns의 format, startOfToday 함수 임포트
import { ko } from 'date-fns/locale'; // 한국어 로케일 임포트
import type { RepeatVO } from '@/features/todos/api/todoApi'; // RepeatVO 타입 임포트

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * @description RepeatVO 객체를 받아 사람이 읽기 쉬운 반복 규칙 문자열로 변환합니다.
 * @param {RepeatVO} repeatVO - 반복 규칙 정보 객체
 * @returns {string} - 포맷된 반복 규칙 문자열
 */
export function formatRepeatRule(repeatVO: RepeatVO): string {
  if (!repeatVO || !repeatVO.type) {
    return '';
  }

  const { type, intervalValue, weekDays, endDate } = repeatVO;
  let ruleText = '';
  const interval = intervalValue && intervalValue > 1 ? `${intervalValue}` : '';

  switch (type) {
    case 'DAILY':
      ruleText = `${interval ? `${interval}일마다` : '매일'} 반복`;
      break;
    case 'WEEKLY':
      if (weekDays && weekDays.length > 0) {
        // 백엔드에서 받은 'MON,TUE' 형태의 문자열을 숫자 배열로 변환하여 정렬합니다.
        const dayStringToNum: { [key: string]: number } = {
          SUN: 0,
          MON: 1,
          TUE: 2,
          WED: 3,
          THU: 4,
          FRI: 5,
          SAT: 6,
        };
        const sortedWeekDays = weekDays
          .split(',')
          .map((day) => dayStringToNum[day.trim()])
          .filter((dayNum) => dayNum !== undefined) // 유효하지 않은 요일 제거
          .sort((a, b) => a - b);

        const days = sortedWeekDays.map((dayNum) => WEEK_DAYS[dayNum]).join(', ');
        ruleText = `${interval ? `${interval}주마다` : '매주'} ${days} 반복`;
      } else {
        ruleText = `${interval ? `${interval}주마다` : '매주'} 반복`;
      }
      break;
    case 'MONTHLY':
      // monthDay 필드가 제거되었으므로, 'dueDate' 기준임을 명시하는 일반적인 텍스트로 변경합니다.
      // 실제 기준일은 Todo의 dueDate에서 가져와야 하지만, 이 함수는 RepeatVO만 받으므로
      // 여기서는 포괄적인 문구를 사용합니다.
      ruleText = `${interval ? `${interval}개월마다` : '매월'} (설정된 날짜 기준) 반복`;
      break;
    default:
      ruleText = '반복 설정됨';
  }

  return ruleText;
}

/**
 * @description 반복 설정의 만료 여부를 확인하는 유틸리티 함수.
 * @param {RepeatVO} repeatVO - 확인할 반복 정보 객체.
 * @returns {boolean} - 반복이 만료되었으면 true, 그렇지 않으면 false.
 */
export function isRepeatExpired(repeatVO: RepeatVO): boolean {
  // 종료일(endDate)이 없으면 만료되지 않은 것으로 간주합니다.
  if (!repeatVO.endDate) {
    return false;
  }

  // 오늘 날짜의 시작(00:00:00)을 기준으로 합니다.
  const today = startOfToday();
  // 종료일을 Date 객체로 변환합니다.
  const endDate = new Date(repeatVO.endDate);

  // 종료일이 오늘 날짜보다 이전이면 '만료된' 것으로 판단합니다.
  return endDate < today;
}
