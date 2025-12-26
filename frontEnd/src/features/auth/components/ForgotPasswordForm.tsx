import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Link } from 'react-router-dom';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/shared/ui/input';
import { useForm } from 'react-hook-form';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../schema/forgotPasswordSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { appToast } from '@/shared/utils/appToast';
import { useAuth } from '../hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ForgotPasswordForm() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  // 커스텀 훅에서 서버 요청 함수와 상태 가져오기
  const { passwordForgot, isLoading } = useAuth();

  // useForm 훅을 사용하여 폼 상태 및 메서드 초기화
  const {
    // 폼 필드를 등록하고 유효성 검사 규칙을 연결하는 함수
    register,
    // 폼 제출 이벤트를 가로채서 유효성 검사 후 onSubmit 콜백을 호출하는 래퍼 함수
    handleSubmit,
    // 필드 실시간 관측을 위한 함수
    watch,
    formState: { errors, isSubmitted }, // 검증시 경고 출력을 위해 가져오기
  } = useForm<ForgotPasswordFormValues>({
    // Zod 스키마를 사용하여 유효성 검사 규칙을 결정하는 리졸버 설정
    resolver: zodResolver(forgotPasswordSchema),
    // 검증 시기를 onChange로 설정
    mode: 'onChange',
  });

  // RHF의 watch를 사용하여 필드의 값을 실시간으로 관찰
  const watchedEmail = watch('email');

  // 검증시 경고 출력을 위한 useEffect
  useEffect(() => {
    // 아직 제출도 안 했는데 토스트 뜨는 것 방지
    if (!isSubmitted) return;

    const firstError = Object.values(errors)[0];
    if (!firstError?.message) return;

    appToast.warning({ message: firstError.message });
  }, [errors, isSubmitted]);

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    console.log(values);

    await passwordForgot(values);

    setIsEmailSent(true);
  };

  if (isEmailSent) {
    return (
      <motion.div
        className="text-center space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">이메일을 확인하세요</h2>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{watchedEmail}</span>로
            <br />
            비밀번호 재설정 링크를 전송했습니다.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-accent/30 border border-border rounded-lg p-4"
        >
          <p className="text-sm text-muted-foreground">
            이메일이 도착하지 않았나요?
            <br />
            스팸 폴더를 확인하거나 몇 분 후 다시 시도해주세요.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Button
            onClick={() => setIsEmailSent(false)}
            variant="outline"
            className="w-full h-12 text-base font-semibold"
          >
            다른 이메일로 재시도
          </Button>

          <Link to="/login" className="block">
            <Button variant="ghost" className="w-full h-12 text-base">
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인으로 돌아가기
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
      variants={containerVariants}
      initial="hidden"
      animate="show"
      autoComplete="off"
    >
      <motion.div
        variants={itemVariants}
        className="bg-accent/30 border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </motion.div>

      <motion.div className="space-y-2" variants={itemVariants}>
        <Label htmlFor="email" className="text-sm font-medium">
          이메일
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="hello@example.com"
            className="pl-10 h-12 bg-card border-border"
            {...register('email')}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading ? '전송 중...' : '비밀번호 재설정 이메일 보내기'}
        </Button>

        <Link to="/login" className="block">
          <Button type="button" variant="ghost" className="w-full h-12 text-base">
            <ArrowLeft className="w-4 h-4 mr-2" />
            로그인으로 돌아가기
          </Button>
        </Link>
      </motion.div>

      <motion.p className="text-center text-sm text-muted-foreground mt-6" variants={itemVariants}>
        계정이 없으신가요?{' '}
        <Link to="/signup" className="text-foreground font-semibold hover:underline">
          회원가입
        </Link>
      </motion.p>
    </motion.form>
  );
}
