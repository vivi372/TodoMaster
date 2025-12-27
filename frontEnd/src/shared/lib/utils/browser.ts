// 로컬스토리지 JSON 안전 처리
/**
 * 로컬 스토리지(LocalStorage) 작업을 안전하게 처리하는 유틸리티 객체입니다.
 * 모든 값은 JSON 형식으로 저장 및 로드되어 객체를 다룰 수 있습니다.
 */
export const storage = {
  /**
   * 로컬 스토리지에서 특정 키의 값을 가져와 JSON 파싱 후 반환합니다.
   * 파싱 오류나 값이 없는 경우를 안전하게 처리합니다.
   *
   * @param key 가져올 데이터의 키
   * @returns 파싱된 데이터 객체 (제네릭 타입 T), 없거나 오류 발생 시 null
   */
  get: <T = unknown>(key: string): T | null => {
    try {
      const value = localStorage.getItem(key);
      // 값이 존재하면 JSON.parse를 시도하여 T 타입으로 캐스팅 후 반환
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      // JSON 파싱 오류 등이 발생하면 null 반환
      return null;
    }
  },

  /**
   * 값을 JSON 문자열로 변환하여 로컬 스토리지에 저장합니다.
   *
   * @param key 저장할 데이터의 키
   * @param value 저장할 값 (객체, 배열 등 모든 타입 가능)
   */
  set: (key: string, value: unknown) => {
    // 값을 JSON.stringify를 사용하여 문자열로 변환하여 저장
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * 로컬 스토리지에서 특정 키의 데이터를 제거합니다.
   *
   * @param key 제거할 데이터의 키
   */
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
};

// 모바일 여부 판별
/**
 * 현재 접속 환경이 모바일 디바이스(Android, iPhone, iPad, iPod)인지 검사합니다.
 * User Agent 문자열을 분석하여 판단합니다.
 *
 * @returns 모바일 환경이면 true, 아니면 false
 */
export const isMobile = (): boolean => {
  // navigator.userAgent: 현재 브라우저의 정보를 담고 있는 문자열
  // /Android|iPhone|iPad|iPod/i: 대소문자를 구분하지 않고 해당 키워드가 있는지 검사
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// URL querystring 파싱
/**
 * 현재 URL의 쿼리 문자열(URLSearchParams)을 파싱하여 객체 형태로 반환합니다.
 * 예: ?foo=1&bar=2 -> { foo: "1", bar: "2" }
 *
 * @returns 쿼리 파라미터가 담긴 객체 (키-값 쌍은 항상 문자열)
 */
export const parseQuery = (): Record<string, string> => {
  // 1. location.search: 현재 URL의 쿼리 문자열(예: "?a=1&b=2")을 가져옴
  // 2. new URLSearchParams(): 쿼리 문자열을 파싱 가능한 객체로 변환
  // 3. Object.fromEntries(): 파싱된 쿼리 항목(Iterable)을 일반 JavaScript 객체로 변환
  return Object.fromEntries(new URLSearchParams(location.search));
};
