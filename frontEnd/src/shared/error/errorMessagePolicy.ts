import type { actionCode } from '../hooks/useMessageActions';
import type { ServerErrorCode } from './types';

export type messagePolicy = {
  type: 'error' | 'warning' | 'info';
  silent?: boolean;
  displayType: 'toast' | 'modal';
  ModalType?: 'alert' | 'confirm';
  action?: actionCode;
};

/**
 * 서버 ErrorCode → 매사장 컴포넌트 정책 매핑
 *
 * silent: true
 *  - 메시징 컴포넌트를 띄우지 않음
 */
export const errorMessagePolicy: Record<ServerErrorCode, messagePolicy> = {
  // ===== 🟢 공통 에러 =====

  // 단순 입력 오류: 토스트로 경고
  INVALID_INPUT_VALUE: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  // 서버 내부 오류: 치명적이므로 모달로 고지 (사용자에게 새로고침 등을 유도)
  INTERNAL_SERVER_ERROR: {
    type: 'error',
    silent: false,
    displayType: 'modal',
    ModalType: 'alert', // 🟢 alert: 단순 고지 후 닫기
  },

  PRESIGNED_URL_GENERATION_FAILED: {
    type: 'error',
    silent: false,
    displayType: 'modal',
    ModalType: 'alert', // 🟢 alert: 단순 고지 후 닫기
  },

  FILE_MOVE_FAILED: {
    type: 'error',
    silent: true,
    displayType: 'toast',
  },

  EMAIL_SENDING_FAILURE: {
    type: 'error',
    silent: false,
    displayType: 'modal',
    ModalType: 'alert', // 🟢 alert: 단순 고지 후 닫기
  },

  // ===== 🔐 인증 / 인가 에러 =====

  // 토큰 관련 에러: 자동 처리 (silent: true, 표시 안 함)
  INVALID_TOKEN: {
    type: 'error',
    silent: true,
    displayType: 'toast',
  },

  EXPIRED_TOKEN: {
    type: 'error',
    silent: true,
    displayType: 'toast',
  },

  TOKEN_NOT_FOUND: {
    type: 'error',
    silent: true,
    displayType: 'toast',
  },

  REFRESH_TOKEN_NOT_FOUND: {
    type: 'error',
    silent: true,
    displayType: 'toast',
  },

  REFRESH_TOKEN_MISMATCH: {
    type: 'error',
    silent: true,
    displayType: 'toast',
  },

  // 권한 없음: 중요하므로 모달로 고지 (로그인 페이지 이동 등을 유도)
  UNAUTHORIZED_USER: {
    type: 'warning',
    silent: false,
    displayType: 'modal',
    ModalType: 'confirm', // ❓ confirm: 로그인 페이지 이동 여부 선택 요구
    action: 'REDIRECT_TO_LOGIN',
  },

  // ===== 👤 회원 에러 (대부분 토스트로 즉시 고지) =====

  PASSWORD_NOT_MATCH: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  INVALID_PASSWORD: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  SAME_PASSWORD_NOT_ALLOWED: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  EMAIL_DUPLICATION: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  NICKNAME_DUPLICATION: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  USER_NOT_FOUND: {
    type: 'warning',
    silent: false,
    displayType: 'toast',
  },

  // 데이터베이스 업데이트 실패: 치명적이므로 모달로 고지
  UPDATE_FAILED: {
    type: 'error',
    silent: false,
    displayType: 'modal',
    ModalType: 'alert', // 🟢 alert: 단순 고지 후 닫기
  },
};
