// 객체의 undefined/null 제거 (API 요청 시 매우 유용)
/**
 * 주어진 객체에서 값이 undefined, null, 또는 빈 문자열("")인 속성들을 제거하여
 * 새로운 객체(Partial<T>)를 반환하는 제네릭 함수입니다.
 * 이는 백엔드 API 요청 시 선택적 필드를 깔끔하게 정리할 때 매우 유용합니다.
 *
 * @param obj 처리할 원본 객체
 * @returns 불필요한 속성이 제거된 새로운 객체
 */
export const cleanObject = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    // 1. Object.entries(obj): 객체를 [키, 값] 쌍의 배열로 변환
    Object.entries(obj).filter(
      // 2. filter: 값이 undefined, null, 또는 ""이 아닌 [키, 값] 쌍만 남김
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  ) as Partial<T>; // 3. Object.fromEntries: 필터링된 [키, 값] 쌍 배열을 다시 객체로 변환
};

// 얕은 비교 (리렌더 최적화)
/**
 * 두 개의 값(주로 객체)이 얕게(Shallowly) 동일한지 비교하는 함수입니다.
 * React/Vue 등 UI 라이브러리에서 컴포넌트의 불필요한 리렌더링을 최적화할 때 사용됩니다.
 *
 * @param a 비교할 첫 번째 값
 * @param b 비교할 두 번째 값
 * @returns 값이 동일하거나, 두 객체의 모든 속성(key)과 그 속성의 값(value)이 동일하면 true, 아니면 false
 */
export const shallowEqual = (a: any, b: any): boolean => {
  // 1. 동일성 검사: 두 객체가 메모리 주소가 같으면(strict equality) 바로 true 반환
  if (a === b) return true;

  // 2. 타입 검사: 둘 중 하나라도 객체가 아니면(기본 타입) false 반환 (객체만 비교 대상으로 간주)
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  // 3. 키 목록 추출 및 개수 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  // 속성의 개수가 다르면 객체는 다름
  if (keysA.length !== keysB.length) return false;

  // 4. 속성 값 얕은 비교
  // keysA의 모든 키(key)에 대해, a[key]와 b[key]의 값이 동일한지(===) 검사
  // (중첩된 객체나 배열의 내부 값은 검사하지 않음, 이것이 '얕은' 비교의 의미)
  return keysA.every((key) => a[key] === b[key]);
};
