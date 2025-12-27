import { api } from '@/shared/lib/api/axios';
import type { ApiResponse } from '@/shared/types/api';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function ErrorPage() {
  // 일반 로그인 Mutation 정의
  const errorMutation = useMutation({
    // 실제 서버 요청을 담당하는 함수 (payload를 인자로 받음)
    mutationFn: () =>
      api.get<ApiResponse<void>>(
        `/api/common/error`, // 계정 활성화 API 엔드포인트
      ),

    // 요청이 성공했을 때 실행되는 콜백
    onSuccess: (data) => {
      console.log(data);
    },
  });

  useEffect(() => {
    errorMutation.mutate();
  }, []);

  return <></>;
}
