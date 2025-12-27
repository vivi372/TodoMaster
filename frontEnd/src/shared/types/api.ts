// 서버에서 내려올 표준 응답 형태를 묶어서 관리
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 페이징 응답
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
}
