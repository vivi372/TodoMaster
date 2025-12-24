import type { AppErrorPolicyMap } from '../api/parseAxiosError';

/**
 * 서버에서 내려주는 에러 코드의 집합
 * - 반드시 백엔드 ErrorCode 와 1:1로 맞춘다
 */
export type ServerErrorCode =
  // ===== 공통 =====
  | 'INVALID_INPUT_VALUE'
  | 'INTERNAL_SERVER_ERROR'
  | 'PRESIGNED_URL_GENERATION_FAILED'
  | 'FILE_MOVE_FAILED'
  | 'EMAIL_SENDING_FAILURE'
  // ===== 인증 / 인가 =====
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'UNAUTHORIZED_USER'
  | 'TOKEN_NOT_FOUND'
  | 'REFRESH_TOKEN_NOT_FOUND'
  | 'REFRESH_TOKEN_MISMATCH'
  | 'AUTHORIZATION_HEADER_MISSING'
  | 'ACCOUNT_VERIFICATION_FAILED'
  // ===== 회원 =====
  | 'PASSWORD_NOT_MATCH'
  | 'EMAIL_DUPLICATION'
  | 'NICKNAME_DUPLICATION'
  | 'VERIFICATION_ACCOUNT_MISSING'
  | 'USER_NOT_FOUND'
  | 'INVALID_PASSWORD'
  | 'SAME_PASSWORD_NOT_ALLOWED'
  | 'UPDATE_FAILED';

/**
 * 프론트 전역에서 사용하는 표준 에러 객체
 */
export interface AppError {
  code?: ServerErrorCode;
  AppErrorPolicyMap: AppErrorPolicyMap;
}
