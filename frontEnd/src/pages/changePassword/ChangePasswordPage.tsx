import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appToast } from '@/shared/utils/appToast';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/shared/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useModal } from '@/shared/store/modalStore';
import {
  changePasswordSchema,
  type ChangePasswordSchemaValues,
} from '@/features/user/schema/changePasswordSchema';
import { useChangePassword } from '@/features/user/hooks/usechangePassword';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ChangePasswordPage() {
  // 모달을 사용하기 위한 커스텀 훅
  const { alert } = useModal();
  // 비밀번호 변경 API 호출을 위한 useMutation 훅
  const { mutateAsync: changePasswordMutate, isPending: isChangingPassword } = useChangePassword();
  const { logout } = useAuth();

  // 비밀번호 입력 필드의 가시성을 제어하는 로컬 상태
  const [showPasswords, setShowPasswords] = useState({
    current: false, // 현재 비밀번호 필드 가시성
    new: false, // 새 비밀번호 필드 가시성
    confirm: false, // 새 비밀번호 확인 필드 가시성
  });

  // react-hook-form 설정:
  // - `changePasswordSchema`를 이용한 Zod 유효성 검사
  // - `onChange` 이벤트 발생 시 유효성 검사 실행
  // - 폼 필드의 기본값 설정
  const {
    register, // 폼 필드를 React Hook Form에 등록하는 함수
    handleSubmit, // 폼 제출 이벤트를 래핑하여 유효성 검사 후 `onSubmit` 함수 호출
    watch, // 특정 필드의 값을 실시간으로 감시하는 함수
    formState: { errors, isSubmitted }, // 폼의 에러 상태 및 제출 여부
  } = useForm<ChangePasswordSchemaValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // 새 비밀번호와 새 비밀번호 확인 필드의 값을 실시간으로 감시
  const watchedNewPassword = watch('newPassword');
  const watchedConfirmNewPassword = watch('confirmNewPassword');

  // 새 비밀번호의 유효성 검사 조건을 실시간으로 평가
  const passwordValidation = {
    minLength: watchedNewPassword.length >= 8, // 최소 8자 이상
    hasLetter: /[a-zA-Z]/.test(watchedNewPassword), // 영문 포함
    hasNumber: /\d/.test(watchedNewPassword), // 숫자 포함
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(watchedNewPassword), // 특수문자 포함
    matches:
      watchedNewPassword === watchedConfirmNewPassword && watchedConfirmNewPassword.length > 0, // 새 비밀번호와 확인 비밀번호 일치
  };

  // 폼 제출 후 에러 발생 시 토스트 메시지를 표시하기 위한 useEffect
  useEffect(() => {
    // 폼이 아직 제출되지 않았다면 경고를 표시하지 않음
    if (!isSubmitted) return;

    // 첫 번째 에러 메시지를 찾음
    const firstError = Object.values(errors)[0];
    if (!firstError?.message) return; // 에러 메시지가 없으면 리턴

    // 에러 메시지를 경고 토스트로 표시
    appToast.warning({ message: firstError.message });
  }, [errors, isSubmitted]); // errors 또는 isSubmitted 상태가 변경될 때마다 실행

  // 폼 제출 시 호출되는 함수
  const onSubmit = async (values: ChangePasswordSchemaValues) => {
    // useMutation의 mutate 함수를 호출하여 비밀번호 변경 API 요청
    await changePasswordMutate({
      currentPassword: values.currentPassword, // 현재 비밀번호
      newPassword: values.newPassword, // 새 비밀번호
    });
    // API 호출 성공 시 실행될 로직
    await alert({
      title: '비밀번호 변경 성공',
      description: '비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.',
      confirmText: '확인',
    });
    // 비밀번호 변경 성공 후 사용자를 강제로 로그아웃 처리
    // 이는 보안 강화를 위함이며, 변경된 비밀번호로 재로그인을 유도합니다.
    logout();
  };

  // 비밀번호 입력 필드의 가시성을 토글하는 함수
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field], // 해당 필드의 가시성 상태를 반전
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex items-center gap-4">
        {/* 프로필 페이지로 돌아가는 버튼 */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">비밀번호 변경</h1>
          <p className="text-muted-foreground">안전한 비밀번호로 변경하세요</p>
        </div>
      </div>

      {/* 비밀번호 변경 폼 */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6 space-y-4">
          {/* 현재 비밀번호 입력 필드 */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              현재 비밀번호 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                placeholder="현재 비밀번호를 입력하세요"
                className="pl-10 pr-12"
                {...register('currentPassword')} // react-hook-form에 필드 등록
                disabled={isChangingPassword} // 비밀번호 변경 중에는 필드 비활성화
              />
              {/* 현재 비밀번호 가시성 토글 버튼 */}
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="h-px bg-border" /> {/* 구분선 */}
          {/* 새 비밀번호 입력 필드 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              새 비밀번호 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                placeholder="새 비밀번호를 입력하세요"
                className="pl-10 pr-12"
                {...register('newPassword')} // react-hook-form에 필드 등록
                disabled={isChangingPassword} // 비밀번호 변경 중에는 필드 비활성화
              />
              {/* 새 비밀번호 가시성 토글 버튼 */}
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {/* 새 비밀번호 확인 입력 필드 */}
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">
              새 비밀번호 확인 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmNewPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="pl-10 pr-12"
                {...register('confirmNewPassword')} // react-hook-form에 필드 등록
                disabled={isChangingPassword} // 비밀번호 변경 중에는 필드 비활성화
              />
              {/* 새 비밀번호 확인 가시성 토글 버튼 */}
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          {/* 비밀번호 유효성 검사 요구사항 목록 */}
          {/* 새 비밀번호가 입력되었을 때만 표시 */}
          {watchedNewPassword && (
            <div className="space-y-2 p-4 rounded-lg bg-accent/50">
              <p className="text-sm font-medium">비밀번호 요구사항</p>
              <ul className="space-y-1">
                {/* 최소 8자 이상 요구사항 */}
                <li className="flex items-center gap-2 text-sm">
                  {passwordValidation.minLength ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    최소 8자 이상
                  </span>
                </li>
                {/* 영문 포함 요구사항 */}
                <li className="flex items-center gap-2 text-sm">
                  {passwordValidation.hasLetter ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      passwordValidation.hasLetter ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    영문 포함
                  </span>
                </li>
                {/* 숫자 포함 요구사항 */}
                <li className="flex items-center gap-2 text-sm">
                  {passwordValidation.hasNumber ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      passwordValidation.hasNumber ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    숫자 포함
                  </span>
                </li>
                {/* 특수문자 포함 요구사항 */}
                <li className="flex items-center gap-2 text-sm">
                  {passwordValidation.hasSpecial ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      passwordValidation.hasSpecial ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    특수문자 포함
                  </span>
                </li>
                {/* 새 비밀번호 일치 요구사항 */}
                <li className="flex items-center gap-2 text-sm">
                  {passwordValidation.matches ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      passwordValidation.matches ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    새 비밀번호 일치
                  </span>
                </li>
              </ul>
            </div>
          )}
          {/* 액션 버튼 그룹 */}
          <div className="flex gap-3 pt-4">
            {/* 비밀번호 변경 제출 버튼 */}
            <Button type="submit" className="flex-1" disabled={isChangingPassword}>
              <Lock className="w-4 h-4 mr-2" />
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
            </Button>
            {/* 취소 버튼 (프로필 페이지로 이동) */}
            <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
              <Link to="/profile">취소</Link>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
