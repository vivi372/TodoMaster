import { useAuth } from '@/features/auth/hooks/useAuth';
import { useModal } from '@/shared/store/modalStore';
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { accountActivation, accountActivationIsLoading } = useAuth();
  // 커스텀 훅에서 모달 alert 관련 함수 가져오기
  const { alert } = useModal();

  useEffect(() => {
    const token = params.get('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // 인증 코드 서버로 전송
    accountActivation({ token })
      .then(async () => {
        // 성공시 모달 출력 후 로그인 페이지로
        // alert 모달 출력
        const descriptionNode: React.ReactNode = (
          <>환영합니다! 자동으로 로그인 페이지로 이동합니다.</>
        );
        const modalProps = {
          title: '계정이 활성화되었습니다.',
          description: descriptionNode,
          confirmText: '계속하기',
        };
        await alert(modalProps);

        navigate('/login', { replace: true });
      })
      .catch(() => {
        // 전역 toast 처리됨 → 여기서 추가 처리 X
        // 실패시 로그인 페이지로 이동
        navigate('/login', { replace: true });
      });
  }, []);

  return <>{accountActivationIsLoading && <LoadingDots fullscreen={true} />}</>;
}
