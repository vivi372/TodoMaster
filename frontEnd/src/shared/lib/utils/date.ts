// yyyy-mm-dd HH:mm:ss 형태로 변환
/**
 * Date 객체 또는 날짜 문자열을 'yyyy. mm. dd. 오전/오후 HH:mm' 형태의 현지 시간 문자열로 변환합니다.
 * (toLocaleString의 'ko-KR' 설정에 따라 최종 출력 포맷이 결정됩니다.)
 *
 * @param date 변환할 Date 객체 또는 날짜 문자열
 * @returns 로케일이 적용된 포맷팅된 날짜 및 시간 문자열
 */
export const formatDateTime = (date: Date | string): string => {
  // 1. 입력이 문자열인 경우 Date 객체로 변환하고, 이미 Date 객체인 경우 그대로 사용합니다.
  const d = typeof date === 'string' ? new Date(date) : date;

  // 2. 'ko-KR' 로케일을 사용하여 포맷팅합니다.
  return d.toLocaleString('ko-KR', {
    year: 'numeric', // 연도 전체 표시 (예: 2023)
    month: '2-digit', // 월 2자리 표시 (예: 01)
    day: '2-digit', // 일 2자리 표시 (예: 05)
    hour: '2-digit', // 시간 2자리 표시 (예: 09)
    minute: '2-digit', // 분 2자리 표시 (예: 30)
    // 초(second)는 포함되어 있지 않으므로 '...:00' 형태는 아닐 수 있습니다.
  });
};

/**
 * Date 객체 또는 날짜 문자열을 'YYYY.MM.DD' 형태의 문자열로 변환합니다.
 * (시간 정보는 제거되고 로컬 시간 기준으로 포맷됩니다.)
 * @param date 변환할 Date 객체 또는 날짜 문자열
 * @returns 'YYYY.MM.DD' 형식의 날짜 문자열
 */
export const formatDate = (date: Date | string): string => {
  // 1. 입력이 문자열인 경우 Date 객체로 변환합니다.
  const d = typeof date === 'string' ? new Date(date) : date;

  // 2. Date 객체가 유효한지 확인합니다.
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  // 3. 연도, 월, 일을 로컬 시간 기준으로 가져옵니다.
  const year = d.getFullYear();

  // getMonth()는 0부터 시작하므로 1을 더합니다.
  // padStart(2, '0')를 사용하여 항상 두 자리 숫자로 만듭니다. (예: 1월 -> 01)
  const month = String(d.getMonth() + 1).padStart(2, '0');

  // padStart(2, '0')를 사용하여 항상 두 자리 숫자로 만듭니다. (예: 5일 -> 05)
  const day = String(d.getDate()).padStart(2, '0');

  // 4. 'YYYY.MM.DD' 형식으로 조합하여 반환합니다.
  return `${year}.${month}.${day}`;
};

// Date 옵션 쉽게 만들기
/**
 * 주어진 날짜(Date)에 특정 일수(days)를 더하여 새로운 Date 객체를 반환합니다.
 * (원본 Date 객체는 수정되지 않습니다.)
 *
 * @param date 기준 날짜 객체
 * @param days 더하거나(양수) 뺄(음수) 일수
 * @returns 일수가 추가된 새로운 Date 객체
 */
export const addDays = (date: Date, days: number): Date => {
  // 1. 원본 객체 수정을 피하기 위해 Date 객체의 복사본을 생성합니다.
  const d = new Date(date);

  // 2. 현재 일(day)에 days를 더하여 날짜를 설정합니다. (Date 객체가 월과 년을 자동으로 처리합니다.)
  d.setDate(d.getDate() + days);

  // 3. 수정된 Date 객체를 반환합니다.
  return d;
};
