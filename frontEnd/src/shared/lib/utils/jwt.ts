// JWT 만료 여부 검사
/**
 * JWT(Access Token)의 만료 시점(exp)을 확인하여 토큰이 만료되었는지 검사합니다.
 *
 * @param token 검사할 JWT 문자열
 * @returns 토큰이 만료되었거나 디코딩에 실패하면 true, 유효하면 false
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    // 1. 토큰 분리 및 페이로드 추출: JWT는 "헤더.페이로드.시그니처" 형태이므로,
    //    split(".")[1]을 사용하여 두 번째 부분(페이로드)만 추출합니다.
    const payloadEncoded = token.split('.')[1];

    // 2. Base64 디코딩 및 JSON 파싱: Base64로 인코딩된 페이로드를 디코딩하고 JSON 객체로 변환합니다.
    const payload = JSON.parse(atob(payloadEncoded));

    // 3. 만료 시간 계산: 'exp' 필드는 초(second) 단위이므로, 1000을 곱하여 밀리초(millisecond)로 변환합니다.
    const exp = payload.exp * 1000;

    // 4. 만료 여부 비교: 현재 시간(Date.now())이 만료 시간(exp)보다 크면 만료된 것으로 판단합니다.
    return Date.now() > exp;
  } catch {
    // 토큰 형식이 잘못되었거나(split 실패) Base64 디코딩/JSON 파싱 실패 시,
    // 보안상 안전하게 만료된 것으로 간주(true)하여 재로그인을 유도합니다.
    return true;
  }
};

// JWT Payload 반환
/**
 * JWT에서 페이로드(Payload) 부분을 추출하여 디코딩된 JSON 객체로 반환합니다.
 *
 * @param token 디코딩할 JWT 문자열
 * @returns 디코딩된 페이로드 객체(제네릭 타입 T), 실패 시 null
 */
export const decodeToken = <T = any>(token: string): T | null => {
  try {
    // 1. 토큰 분리: 페이로드 부분(두 번째 요소)을 추출합니다.
    const payloadEncoded = token.split('.')[1];

    // 2. Base64 디코딩 및 JSON 파싱: 디코딩 후 T 타입의 객체로 캐스팅하여 반환합니다.
    return JSON.parse(atob(payloadEncoded)) as T;
  } catch {
    // 디코딩 또는 파싱 실패 시 null 반환
    return null;
  }
};
