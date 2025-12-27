// 공백 제거 + null/undefined 안전 처리
export const cleanString = (value?: string | null): string => {
  // value가 null 또는 undefined가 아닌 경우에만 .trim()을 호출 (선택적 체이닝: ?. )
  // 만약 value가 null/undefined이거나 .trim() 결과가 null/undefined이면 (널 병합 연산자: ?? )
  // 대신 빈 문자열("")을 반환하여 항상 string 타입을 보장함
  return value?.trim() ?? '';
};

// 전화번호 포맷 01012341234 → 010-1234-1234
export const formatPhone = (phone: string): string => {
  // 전화번호에서 숫자(Digit)가 아닌 모든 문자(\D)를 전역적으로(g) 찾아서 제거함.
  // 이로 인해 하이픈, 괄호 등이 모두 제거된 순수 숫자만 남게 됨.
  const cleaned = phone.replace(/\D/g, '');
  // cleaned 문자열을 특정 패턴(3자리, 3~4자리, 4자리)으로 찾아서 캡처 그룹($1, $2, $3)으로 분리한 뒤
  // 각 그룹 사이에 하이픈(-)을 넣어 포맷팅함.
  return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
};

// 숫자 10000 → "10,000"
export const numberWithComma = (num: number | string): string => {
  // 입력 num이 문자열일 경우 숫자로 변환함.
  const n = Number(num);
  // n이 유효한 숫자가 아닌 경우(isNaN) 빈 문자열을 반환하여 오류 방지.
  // 유효한 숫자일 경우 toLocaleString("ko-KR")을 사용하여 한국 표준 콤마(천 단위 구분 기호)를 넣음.
  return isNaN(n) ? '' : n.toLocaleString('ko-KR');
};

// 문자열 마스킹 (이메일/이름 등)
export const maskString = (str: string, visible = 2): string => {
  // 'visible' 매개변수에 값이 전달되지 않으면 기본값으로 2를 사용 (Default Parameter)

  // 마스킹할 문자열의 길이가 보여줄 문자 수보다 작거나 같으면 마스킹 없이 원본 반환.
  if (str.length <= visible) return str;

  // 전체 길이에서 보여줄 문자 수를 뺀 만큼 '*' 문자를 반복하여 마스크 문자열 생성.
  const mask = '*'.repeat(str.length - visible);

  // 원본 문자열의 시작(0)부터 'visible' 수만큼만 잘라내고 (.substring)
  // 그 뒤에 생성된 마스크 문자열을 붙여서 반환함.
  return str.substring(0, visible) + mask;
};
