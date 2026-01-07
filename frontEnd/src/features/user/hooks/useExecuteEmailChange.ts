import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { AppError } from '@/shared/error/types';
import { appToast } from '@/shared/utils/appToast';
import { useNavigate } from 'react-router-dom';
import { authQueryKeys, userQueryKeys } from '@/shared/const/queryKeys';
import type { ExecuteEmailChangeBody } from '../types/userTypes';

type useExecuteEmailChangeProps = {
  onError: (error: any) => void;
};

/**
 * @description 인증 코드를 사용하여 이메일 변경을 최종 실행하는 뮤테이션 훅입니다.
 * 성공 시, 사용자 프로필 관련 쿼리를 무효화하고 프로필 페이지로 이동합니다.
 * @returns React Query의 뮤테이션 객체를 반환합니다.
 */
export const useExecuteEmailChange = ({ onError }: useExecuteEmailChangeProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, AppError, ExecuteEmailChangeBody>({
    mutationFn: userApi.executeEmailChange,
    onSuccess: () => {
      appToast.success({ message: '이메일이 성공적으로 변경되었습니다!' });

      // Invalidate user-related queries to refetch the data
      queryClient.invalidateQueries({ queryKey: authQueryKeys.profile() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.summary() });

      navigate('/profile');
    },
    onError,
  });
};
