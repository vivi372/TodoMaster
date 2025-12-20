import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export default function SocialRedirectPage() {
  // 1. URL 매개변수에서 ':provider' 값 (예: 'kakao', 'google')을 가져옵니다.
  const { provider } = useParams<{ provider: 'google' | 'kakao' }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { socialLogin } = useAuth();

  useEffect(() => {
    const code = params.get('code');

    if (!code || !provider) {
      navigate('/login', { replace: true });
      return;
    }

    // 인증 코드 서버로 전송
    socialLogin({ provider, code })
      .then(() => {
        // 성공시 로그인 처리후 투두 페이지로
        navigate('/todos', { replace: true });
      })
      .catch(() => {
        // 전역 toast 처리됨 → 여기서 추가 처리 X
        // 실패시 로그인 페이지로 이동
        navigate('/login', { replace: true });
      });
  }, []);

  return <LoadingDots fullscreen={true} />; // 로딩 UI
}
