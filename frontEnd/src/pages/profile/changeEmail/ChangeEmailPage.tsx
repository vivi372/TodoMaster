// --- 1. Imports ---
// React 및 관련 훅 임포트
import { useState, useEffect, useRef } from 'react';
// 라우팅을 위한 Link 컴포넌트 임포트
import { Link } from 'react-router-dom';
// 폼 관리를 위한 react-hook-form 관련 훅 및 타입 임포트
import { useForm, FormProvider, useFormContext, type SubmitHandler } from 'react-hook-form';
// Zod 스키마 유효성 검사를 위한 리졸버 임포트
import { zodResolver } from '@hookform/resolvers/zod';
// Zod 유효성 검사 라이브러리 임포트
import * as z from 'zod';
// 애니메이션을 위한 framer-motion 임포트
import { motion } from 'framer-motion';
// 아이콘 라이브러리 lucide-react에서 필요한 아이콘 임포트
import {
  ArrowLeft, // 뒤로 가기
  Mail, // 이메일
  Lock, // 잠금 (비밀번호)
  CheckCircle2, // 확인 완료
  Send, // 전송
  Clock, // 시계 (타이머)
  Eye, // 보기 (비밀번호 표시)
  EyeOff, // 숨기기 (비밀번호 숨김)
  AlertCircle, // 경고
  KeyRound, // 카카오 키 (카카오 로그인 관련)
} from 'lucide-react';

// --- Project Files ---
// 사용자 알림 토스트 메시지 유틸리티
import { appToast } from '@/shared/utils/appToast';
// 타이머 기능을 위한 커스텀 훅
import useTimer from '@/shared/hooks/useTimer';
// 인증 상태 관리를 위한 Zustand 스토어
import { authStore } from '@/features/auth/store/authStore';
// 이메일 인증 요청 훅 (일반 계정)
import { useRequestEmailVerification } from '@/features/user/hooks/useRequestEmailVerification';
// 카카오 이메일 변경 인증 요청 훅
import { useRequestKakaoEmailChangeVerification } from '@/features/user/hooks/useRequestKakaoEmailChangeVerification';
// 인증 코드 재전송 훅
import { useResendVerificationCode } from '@/features/user/hooks/useResendVerificationCode';
// 이메일 변경 실행 훅
import { useExecuteEmailChange } from '@/features/user/hooks/useExecuteEmailChange';

// --- UI Components ---
// 재사용 가능한 UI 컴포넌트 임포트
import { Button } from '@/shared/ui/button'; // 버튼
import { Card } from '@/shared/ui/card'; // 카드
import { Label } from '@/shared/ui/label'; // 라벨
import { Input } from '@/shared/ui/input'; // 입력 필드
import { parseAxiosError } from '@/shared/api/parseAxiosError'; // Axios 에러 파싱 유틸리티
import { Skeleton } from '@/shared/ui/skeleton'; // 스켈레톤 로딩 UI

// --- Form Schemas ---
// 일반 계정의 이메일 변경 요청 시 사용되는 Zod 스키마
const standardRequestSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'), // 현재 비밀번호 필드 (1자 이상 필수)
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'), // 새 이메일 필드 (유효한 이메일 형식 필수)
});
// 카카오 계정의 이메일 변경 요청 시 사용되는 Zod 스키마 (비밀번호 확인 없음)
const kakaoRequestSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'), // 새 이메일 필드 (유효한 이메일 형식 필수)
});
// 인증 코드 확인 시 사용되는 Zod 스키마
const verifySchema = z.object({
  verificationCode: z.string().length(6, '인증 코드는 6자리여야 합니다.'), // 6자리 인증 코드 필드
});

// 폼 값의 타입을 추론합니다.
type StandardRequestFormValues = z.infer<typeof standardRequestSchema>;
type KakaoRequestFormValues = z.infer<typeof kakaoRequestSchema>;
type VerifyFormValues = z.infer<typeof verifySchema>;

// --- Main Container Component ---
// 이메일 변경 페이지의 메인 컨테이너 컴포넌트
export default function ChangeEmailPage() {
  // 인증 스토어에서 사용자 제공자(standard 또는 kakao)와 인증 초기화 상태를 가져옵니다.
  const provider = authStore((state) => state.provider);
  const isAuthInitialized = authStore((state) => state.isAuthInitialized);

  // 인증 상태가 초기화되지 않았다면 스켈레톤 UI를 보여줍니다.
  if (!isAuthInitialized) {
    return <PageSkeleton />;
  }

  // 인증 상태가 초기화되면, 사용자 제공자에 따라 적절한 이메일 변경 컴포넌트를 렌더링합니다.
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader /> {/* 페이지 헤더 컴포넌트 */}
      {provider === 'standard' && <StandardChangeEmail />}
      {/* 일반 계정 사용자용 이메일 변경 */}
      {provider === 'kakao' && <KakaoChangeEmail />}
      {/* 카카오 계정 사용자용 이메일 변경 */}
    </div>
  );
}

// --- Local User Component ---
// 일반 계정 사용자를 위한 이메일 변경 흐름 컴포넌트
function StandardChangeEmail() {
  // 현재 단계를 관리하는 상태 (인증 정보 입력 또는 코드 확인)
  const [step, setStep] = useState<'verify' | 'code'>('verify');
  // 이메일 변경 흐름에 필요한 공통 로직을 담은 커스텀 훅
  const commonProps = useEmailChangeFlow();

  // 일반 계정 요청 폼을 위한 react-hook-form 설정
  const requestForm = useForm<StandardRequestFormValues>({
    resolver: zodResolver(standardRequestSchema), // Zod 스키마를 이용한 유효성 검사
    mode: 'onBlur', // 필드를 벗어날 때 유효성 검사
  });
  // 이메일 인증 요청 뮤테이션 훅 (성공 시 코드 확인 단계로 전환)
  const { mutateAsync: requestVerification, isPending: isRequesting } = useRequestEmailVerification(
    () => {
      commonProps.onSuccess(); // 인증 요청 성공 처리
      setStep('code'); // 코드 확인 단계로 변경
    },
  );

  // 인증 요청 폼 제출 핸들러
  const onRequestSubmit: SubmitHandler<StandardRequestFormValues> = async (data) => {
    await requestVerification(data); // 이메일 인증 요청 실행
  };

  return (
    <>
      {/* 진행 상황 추적기 컴포넌트 */}
      <ProgressTracker step={step} isKakao={false} />
      {/* 폼 제공자 설정 */}
      <FormProvider {...requestForm}>
        {/* 인증 정보 입력 폼 (현재 단계가 'verify'일 때만 표시) */}
        <form
          onSubmit={requestForm.handleSubmit(onRequestSubmit, commonProps.onFormError)} // 폼 제출 및 에러 핸들러
          style={{ display: step === 'verify' ? 'block' : 'none' }}
          autoComplete="off"
          noValidate
        >
          <StandardRequestForm isSubmitting={isRequesting} /> {/* 일반 계정 요청 폼 컴포넌트 */}
        </form>
      </FormProvider>
      {/* 인증 코드 확인 흐름 컴포넌트 */}
      <VerifyFlow
        step={step} // 현재 단계
        newEmail={requestForm.watch('email')} // 새 이메일 주소
        onGoBack={() => setStep('verify')} // 이전 단계로 돌아가기 핸들러
        {...commonProps} // 공통 속성 전달
      />
    </>
  );
}

// --- Kakao User Component ---
// 카카오 계정 사용자를 위한 이메일 변경 흐름 컴포넌트
function KakaoChangeEmail() {
  // 현재 단계를 관리하는 상태 (인증 정보 입력 또는 코드 확인)
  const [step, setStep] = useState<'verify' | 'code'>('verify');
  // 이메일 변경 흐름에 필요한 공통 로직을 담은 커스텀 훅
  const commonProps = useEmailChangeFlow();

  // 카카오 계정 요청 폼을 위한 react-hook-form 설정
  const requestForm = useForm<KakaoRequestFormValues>({
    resolver: zodResolver(kakaoRequestSchema), // Zod 스키마를 이용한 유효성 검사
    mode: 'onBlur', // 필드를 벗어날 때 유효성 검사
  });
  // 카카오 이메일 변경 인증 요청 뮤테이션 훅 (성공 시 코드 확인 단계로 전환)
  const { mutateAsync: requestVerification, isPending: isRequesting } =
    useRequestKakaoEmailChangeVerification(() => {
      commonProps.onSuccess(); // 인증 요청 성공 처리
      setStep('code'); // 코드 확인 단계로 변경
    });

  // 인증 요청 폼 제출 핸들러
  const onRequestSubmit: SubmitHandler<KakaoRequestFormValues> = async (data) => {
    await requestVerification({ newEmail: data.email }); // 카카오 이메일 변경 인증 요청 실행
  };

  return (
    <>
      {/* 진행 상황 추적기 컴포넌트 */}
      <ProgressTracker step={step} isKakao={true} />
      {/* 폼 제공자 설정 */}
      <FormProvider {...requestForm}>
        {/* 인증 정보 입력 폼 (현재 단계가 'verify'일 때만 표시) */}
        <form
          onSubmit={requestForm.handleSubmit(onRequestSubmit, commonProps.onFormError)} // 폼 제출 및 에러 핸들러
          style={{ display: step === 'verify' ? 'block' : 'none' }}
          autoComplete="off"
          noValidate
        >
          <KakaoRequestForm isSubmitting={isRequesting} /> {/* 카카오 계정 요청 폼 컴포넌트 */}
        </form>
      </FormProvider>
      {/* 인증 코드 확인 흐름 컴포넌트 */}
      <VerifyFlow
        step={step} // 현재 단계
        newEmail={requestForm.watch('email')} // 새 이메일 주소
        onGoBack={() => setStep('verify')} // 이전 단계로 돌아가기 핸들러
        {...commonProps} // 공통 속성 전달
      />
    </>
  );
}

// --- Common Logic Hook ---
// 이메일 변경 흐름에 필요한 모든 공통 로직(상태, 타이머, 핸들러 등)을 캡슐화한 커스텀 훅
function useEmailChangeFlow() {
  // 인증 코드 재전송 횟수 상태
  const [resendCount, setResendCount] = useState(0);
  // 인증 실패 횟수 상태
  const [verificationErrorCount, setVerificationErrorCount] = useState(0);
  // 최대 인증 실패 허용 횟수
  const MAX_ERROR_ATTEMPTS = 5;
  // 최대 에러 횟수에 도달했는지 여부
  const isMaxErrorReached = verificationErrorCount >= MAX_ERROR_ATTEMPTS;

  // 재전송 쿨다운 타이머 관리 훅 (20초)
  const {
    isCounting: isResendCooldown, // 쿨다운 중인지 여부
    remainingTime: resendCooldown, // 남은 쿨다운 시간
    startTimer: startResendCooldownTimer, // 쿨다운 타이머 시작 함수
    stopTimer: stopResendCooldownTimer, // 쿨다운 타이머 중지 함수
  } = useTimer({ cooldownSeconds: 20 });

  // 재전송 제한 타이머 관리 훅 (60초, 타이머 종료 시 재전송 횟수 초기화)
  const { startTimer: startResendLimitTimer, isCounting: isResendLimitActive } = useTimer({
    cooldownSeconds: 60,
    onTimerEnd: () => {
      setResendCount(0); // 재전송 횟수 초기화
      appToast.info({ message: '이제 다시 인증 코드를 재전송할 수 있습니다.' }); // 사용자 알림
    },
  });

  // 재전송 횟수가 1회이고 재전송 제한 타이머가 활성화되지 않았다면 제한 타이머를 시작
  useEffect(() => {
    if (resendCount === 1 && !isResendLimitActive) startResendLimitTimer();
  }, [resendCount, isResendLimitActive, startResendLimitTimer]);

  // 인증 코드 유효 시간 상태 (기본 300초 = 5분)
  const [verificationTime, setVerificationTime] = useState(300);
  // 인증 타이머 실행 여부 상태
  const [isVerificationTimerRunning, setIsVerificationTimerRunning] = useState(false);
  // 인증 타이머 인터벌 ID를 저장하기 위한 useRef
  const verificationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 인증 타이머 로직
  useEffect(() => {
    // 타이머가 실행 중이고 남은 시간이 있다면 1초마다 시간 감소
    if (isVerificationTimerRunning && verificationTime > 0) {
      verificationTimerRef.current = setInterval(() => setVerificationTime((p) => p - 1), 1000);
    } else if (verificationTime === 0 && isVerificationTimerRunning) {
      // 시간이 0이 되면 타이머 중지 및 만료 알림
      setIsVerificationTimerRunning(false);
      if (verificationTimerRef.current) clearInterval(verificationTimerRef.current);
      appToast.warning({ message: '인증 코드가 만료되었습니다. 재전송해주세요.' });
    }
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (verificationTimerRef.current) clearInterval(verificationTimerRef.current);
    };
  }, [isVerificationTimerRunning, verificationTime]);

  // 인증 코드 확인 폼을 위한 react-hook-form 설정
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema), // Zod 스키마를 이용한 유효성 검사
    mode: 'onBlur', // 필드를 벗어날 때 유효성 검사
  });

  // 인증 코드 재전송 뮤테이션 훅 (성공 시 타이머 및 상태 초기화)
  const { mutate: resendCode, isPending: isResending } = useResendVerificationCode(() => {
    appToast.success({ message: '인증 코드가 재전송되었습니다!' }); // 성공 알림
    setVerificationTime(300); // 인증 시간 초기화
    setIsVerificationTimerRunning(true); // 인증 타이머 시작
    startResendCooldownTimer(); // 재전송 쿨다운 시작
    setResendCount((prev) => prev + 1); // 재전송 횟수 증가
    verifyForm.setValue('verificationCode', ''); // 인증 코드 필드 초기화
    setVerificationErrorCount(0); // 인증 실패 횟수 초기화
  });

  // 이메일 변경 실행 뮤테이션 훅 (에러 처리 포함)
  const { mutate: executeChange, isPending: isExecuting } = useExecuteEmailChange({
    onError: (error) => {
      const appError = parseAxiosError(error);
      // 특정 에러 코드(VERIFICATION_CODE_FAILURE_LIMIT) 발생 시 재전송 횟수 및 쿨다운 초기화
      if (appError && typeof appError === 'object' && 'code' in appError && appError.code) {
        if (appError.code === 'VERIFICATION_CODE_FAILURE_LIMIT') {
          setResendCount(0);
          stopResendCooldownTimer();
        }
      }
      setVerificationErrorCount((prev) => prev + 1); // 인증 실패 횟수 증가
    },
  });

  // 폼 제출 시 발생하는 에러를 처리하는 함수
  const onFormError = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      appToast.error({ message: errors[firstErrorKey].message as string }); // 첫 번째 에러 메시지 토스트로 표시
    }
  };

  // 인증 코드 재전송 핸들러
  const handleResend = (email: string) => {
    // 쿨다운 중이거나 재전송 횟수(3회)를 초과했거나 재전송 중이면 함수 실행 중지
    if (isResendCooldown || resendCount >= 3 || isResending) return;
    resendCode({ email }); // 인증 코드 재전송 요청
  };

  // 시간을 '분:초' 형식으로 포맷하는 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`; // 2자리로 패딩
  };

  // 컴포넌트에서 사용할 상태, 함수 등을 반환
  return {
    onSuccess: () => {
      appToast.success({ message: '인증 코드가 새 이메일로 전송되었습니다!' }); // 성공 알림
      setVerificationTime(300); // 인증 시간 초기화
      setIsVerificationTimerRunning(true); // 인증 타이머 시작
      startResendCooldownTimer(); // 재전송 쿨다운 시작
      setResendCount(1); // 재전송 횟수 초기화 (첫 전송이므로 1로 설정)
    },
    verifyForm, // 인증 폼 객체
    isExecuting, // 이메일 변경 실행 중 여부
    isResending, // 인증 코드 재전송 중 여부
    verificationTime, // 남은 인증 시간
    isVerificationTimerRunning, // 인증 타이머 실행 중 여부
    resendCooldown, // 재전송 쿨다운 남은 시간
    isResendCooldown, // 재전송 쿨다운 중 여부
    resendCount, // 재전송 횟수
    verificationErrorCount, // 인증 실패 횟수
    isMaxErrorReached, // 최대 에러 횟수 도달 여부
    onFormError, // 폼 에러 핸들러
    handleResend, // 재전송 핸들러
    executeChange, // 이메일 변경 실행 함수
    formatTime, // 시간 포맷 함수
  };
}

// --- Common Verify Form Component ---
// 인증 코드 확인 흐름을 담당하는 공통 컴포넌트
function VerifyFlow({ step, newEmail, onGoBack, ...props }: any) {
  // 인증 코드 제출 핸들러
  const onVerifySubmit: SubmitHandler<VerifyFormValues> = (data) => {
    // 인증 시간이 만료되었으면 에러 메시지 표시
    if (props.verificationTime === 0) {
      appToast.error({ message: '인증 코드를 재전송해주세요.' });
      return;
    }
    // 이메일 변경 실행
    props.executeChange({ newEmail, verificationCode: data.verificationCode });
  };

  return (
    <FormProvider {...props.verifyForm}>
      {/* 인증 코드 입력 폼 (현재 단계가 'code'일 때만 표시) */}
      <form
        onSubmit={props.verifyForm.handleSubmit(onVerifySubmit, props.onFormError)} // 폼 제출 및 에러 핸들러
        style={{ display: step === 'code' ? 'block' : 'none' }}
      >
        <VerifyForm
          isSubmitting={props.isExecuting} // 이메일 변경 실행 중 여부
          isResending={props.isResending} // 인증 코드 재전송 중 여부
          newEmail={newEmail} // 새 이메일 주소
          timeRemaining={props.verificationTime} // 남은 인증 시간
          isTimerRunning={props.isVerificationTimerRunning} // 인증 타이머 실행 중 여부
          resendCooldown={props.resendCooldown} // 재전송 쿨다운 남은 시간
          isResendCooldown={props.isResendCooldown} // 재전송 쿨다운 중 여부
          resendCount={props.resendCount} // 재전송 횟수
          onResend={() => props.handleResend(newEmail)} // 재전송 핸들러
          onGoBack={onGoBack} // 이전 단계로 돌아가기 핸들러
          formatTime={props.formatTime} // 시간 포맷 함수
          verificationErrorCount={props.verificationErrorCount} // 인증 실패 횟수
          isMaxErrorReached={props.isMaxErrorReached} // 최대 에러 횟수 도달 여부
        />
      </form>
    </FormProvider>
  );
}

// --- UI Sub-components ---
// 페이지 헤더 컴포넌트
const PageHeader = () => (
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="icon" asChild>
      {/* 프로필 페이지로 돌아가는 링크 */}
      <Link to="/profile">
        <ArrowLeft className="w-5 h-5" />
      </Link>
    </Button>
    <div>
      <h1 className="text-2xl font-bold">이메일 변경</h1> {/* 페이지 제목 */}
      <p className="text-muted-foreground">보안을 위해 본인 확인이 필요합니다</p>{' '}
      {/* 설명 메시지 */}
    </div>
  </div>
);

// 페이지 로딩 시 표시되는 스켈레톤 UI 컴포넌트
const PageSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="w-10 h-10" /> {/* 아이콘 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" /> {/* 제목 스켈레톤 */}
        <Skeleton className="h-5 w-64" /> {/* 설명 스켈레톤 */}
      </div>
    </div>
    <Skeleton className="w-full h-24" /> {/* 카드 스켈레톤 1 */}
    <Skeleton className="w-full h-96" /> {/* 카드 스켈레톤 2 */}
  </div>
);

// 이메일 변경 진행 상황을 보여주는 트래커 컴포넌트
const ProgressTracker = ({ step, isKakao }: { step: 'verify' | 'code'; isKakao: boolean }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between relative">
      {/* 진행 바 */}
      <div className="absolute top-5 left-0 right-0 h-1 bg-muted -z-10">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          // 단계에 따라 너비를 조절하여 진행 상황을 시각화
          animate={{ width: step === 'verify' ? '0%' : '100%' }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {/* 첫 번째 단계 (본인 확인 또는 비밀번호 확인) */}
      <ProgressStep
        icon={step === 'verify' ? (isKakao ? KeyRound : Lock) : CheckCircle2}
        label={isKakao ? '본인 확인' : '비밀번호 확인'}
        isActive
      />
      {/* 두 번째 단계 (이메일 인증) */}
      <ProgressStep icon={Mail} label="이메일 인증" isActive={step === 'code'} />
    </div>
  </Card>
);

// 진행 상황 트래커의 개별 단계 컴포넌트
const ProgressStep = ({
  icon: Icon,
  label,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
    >
      <Icon className="w-5 h-5" /> {/* 단계 아이콘 */}
    </div>
    <span
      className={`font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      {label} {/* 단계 라벨 */}
    </span>
  </div>
);

// 일반 계정 사용자의 비밀번호 확인 및 새 이메일 입력 폼 컴포넌트
const StandardRequestForm = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { register } = useFormContext(); // 폼 컨텍스트에서 register 함수 가져오기
  const [showPassword, setShowPassword] = useState(false); // 비밀번호 표시/숨김 상태
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">비밀번호 확인</h2> {/* 섹션 제목 */}
        <p className="text-sm text-muted-foreground">
          현재 비밀번호와 변경할 새 이메일 주소를 입력하세요 {/* 섹션 설명 */}
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            현재 비밀번호 <span className="text-destructive">*</span> {/* 현재 비밀번호 라벨 */}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />{' '}
            {/* 잠금 아이콘 */}
            <Input
              id="currentPassword"
              type={showPassword ? 'text' : 'password'} // 비밀번호 표시/숨김 토글
              placeholder="현재 비밀번호를 입력하세요"
              className="pl-10 pr-12"
              autoComplete="new-password"
              {...register('currentPassword')} // 폼 필드 등록
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}{' '}
              {/* 눈 아이콘 토글 */}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newEmail">
            새 이메일 <span className="text-destructive">*</span> {/* 새 이메일 라벨 */}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />{' '}
            {/* 이메일 아이콘 */}
            <Input
              id="newEmail"
              type="email"
              placeholder="새 이메일 주소를 입력하세요"
              className="pl-10"
              {...register('email')} // 폼 필드 등록
              autoComplete="off"
            />
          </div>
        </div>
      </div>
      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>안내:</strong> 새 이메일로 인증 코드가 전송됩니다. 인증 코드를 입력하여 이메일
        변경을 완료하세요.
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? '전송 중...' : '인증 코드 받기'} {/* 제출 버튼 텍스트 */}
        </Button>
        <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
          <Link to="/profile">취소</Link>
        </Button>
      </div>
    </Card>
  );
};

// 카카오 계정 사용자의 새 이메일 입력 폼 컴포넌트
const KakaoRequestForm = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { register } = useFormContext(); // 폼 컨텍스트에서 register 함수 가져오기
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">새 이메일 입력</h2> {/* 섹션 제목 */}
        <p className="text-sm text-muted-foreground">변경할 새 이메일 주소를 입력하세요.</p>{' '}
        {/* 섹션 설명 */}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newEmail">
          새 이메일 <span className="text-destructive">*</span> {/* 새 이메일 라벨 */}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />{' '}
          {/* 이메일 아이콘 */}
          <Input
            id="newEmail"
            type="email"
            placeholder="새 이메일 주소를 입력하세요"
            className="pl-10"
            {...register('email')} // 폼 필드 등록
            autoComplete="off"
          />
        </div>
      </div>
      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>안내:</strong> 카카오 계정 사용자는 비밀번호 확인 없이 바로 새 이메일로 인증 코드를
        받을 수 있습니다.
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? '전송 중...' : '인증 코드 받기'} {/* 제출 버튼 텍스트 */}
        </Button>
        <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
          <Link to="/profile">취소</Link>
        </Button>
      </div>
    </Card>
  );
};

// 인증 코드 입력 및 확인 폼 컴포넌트
const VerifyForm = (props: any) => {
  const {
    isSubmitting, // 이메일 변경 실행 중 여부
    isResending, // 인증 코드 재전송 중 여부
    newEmail, // 새 이메일 주소
    timeRemaining, // 남은 인증 시간
    isTimerRunning, // 인증 타이머 실행 중 여부
    resendCooldown, // 재전송 쿨다운 남은 시간
    isResendCooldown, // 재전송 쿨다운 중 여부
    resendCount, // 재전송 횟수
    onResend, // 재전송 핸들러
    onGoBack, // 이전 단계로 돌아가기 핸들러
    formatTime, // 시간 포맷 함수
    verificationErrorCount, // 인증 실패 횟수
    isMaxErrorReached, // 최대 에러 횟수 도달 여부
  } = props;
  const { register } = useFormContext(); // 폼 컨텍스트에서 register 함수 가져오기
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">이메일 인증</h2> {/* 섹션 제목 */}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{newEmail}</span>로 전송된 인증 코드를
          입력하세요 {/* 섹션 설명 */}
        </p>
      </div>
      <TimerDisplay timeRemaining={timeRemaining} formatTime={formatTime} />{' '}
      {/* 타이머 표시 컴포넌트 */}
      {/* 인증 실패 메시지 (에러 횟수가 0보다 클 때 표시) */}
      {verificationErrorCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600" /> {/* 경고 아이콘 */}
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              인증 실패 {verificationErrorCount}/5회 {/* 실패 횟수 표시 */}
            </p>
            <p className="text-xs text-red-600">
              {isMaxErrorReached
                ? '인증 코드 오류 횟수를 초과했습니다. 재전송을 시도해 주세요.'
                : '5회 실패 시 인증 코드를 재전송해야 합니다'}{' '}
              {/* 실패 횟수에 따른 안내 메시지 */}
            </p>
          </div>
        </motion.div>
      )}
      <div className="space-y-2">
        <Label htmlFor="verificationCode">
          인증 코드 <span className="text-destructive">*</span> {/* 인증 코드 라벨 */}
        </Label>
        <Input
          id="verificationCode"
          placeholder="6자리 인증 코드"
          maxLength={6}
          className="text-center text-2xl tracking-widest font-mono"
          disabled={!isTimerRunning || isSubmitting || isMaxErrorReached} // 입력 필드 비활성화 조건
          {...register('verificationCode')} // 폼 필드 등록
        />
      </div>
      <ResendButton
        onResend={onResend}
        resendCooldown={resendCooldown}
        isResendCooldown={isResendCooldown}
        resendCount={resendCount}
        isResending={isResending}
      />{' '}
      {/* 재전송 버튼 컴포넌트 */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || !isTimerRunning || isMaxErrorReached} // 제출 버튼 비활성화 조건
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {isSubmitting ? '확인 중...' : '인증 완료'} {/* 제출 버튼 텍스트 */}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onGoBack}
          className="flex-1 bg-transparent"
        >
          이전으로 {/* 이전으로 버튼 */}
        </Button>
      </div>
    </Card>
  );
};

// 타이머를 표시하는 컴포넌트
const TimerDisplay = ({
  timeRemaining,
  formatTime,
}: {
  timeRemaining: number;
  formatTime: (t: number) => string;
}) => {
  const isExpired = timeRemaining === 0; // 시간이 만료되었는지 여부
  // 남은 시간에 따라 색상 클래스 결정
  const timeColorClass = timeRemaining > 60 ? 'green' : timeRemaining > 0 ? 'yellow' : 'red';
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg bg-${timeColorClass}-50 border border-${timeColorClass}-200`}
    >
      <Clock className={`w-5 h-5 text-${timeColorClass}-600`} /> {/* 시계 아이콘 */}
      <p className={`text-sm font-medium text-${timeColorClass}-800`}>
        {isExpired ? '인증 코드가 만료되었습니다' : `남은 시간: ${formatTime(timeRemaining)}`}{' '}
        {/* 타이머 메시지 */}
      </p>
    </div>
  );
};

// 인증 코드 재전송 버튼 컴포넌트
const ResendButton = (props: any) => {
  const { onResend, resendCooldown, isResendCooldown, resendCount, isResending } = props;
  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-muted-foreground">인증 코드를 받지 못하셨나요?</p>{' '}
      {/* 안내 메시지 */}
      <Button
        type="button"
        variant="outline"
        className="w-full bg-primary/10 border-primary/30 hover:bg-primary/20 font-medium"
        onClick={onResend}
        disabled={isResendCooldown || resendCount >= 3 || isResending} // 재전송 버튼 비활성화 조건
      >
        <Send className="w-4 h-4 mr-2" />
        인증 코드 재전송 {isResendCooldown && ` (${resendCooldown}초 대기)`}{' '}
        {/* 재전송 버튼 텍스트 */}
      </Button>
      <p className="text-xs text-muted-foreground">재전송 {resendCount}/3회 (1분당 3회 제한)</p>{' '}
      {/* 재전송 횟수 제한 안내 */}
    </div>
  );
};
