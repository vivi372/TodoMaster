import type React from 'react';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  Send,
  Clock,
  AlertCircle,
  EyeOff,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { appToast } from '@/shared/utils/appToast';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/shared/ui/input';

export default function ChangeEmailPage() {
  const navgate = useNavigate();
  const [step, setStep] = useState<'verify' | 'code'>('verify');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newEmail: '',
    verificationCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // 타이머 (인증 코드 만료 카운트다운)
  useEffect(() => {
    if (!codeExpiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((codeExpiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        showToast.warning('인증 코드가 만료되었습니다. 재전송해주세요.');
        setIsBlocked(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 실제로는 비밀번호 확인 및 인증 코드 전송 API 호출
    setTimeout(() => {
      setIsSubmitting(false);
      setEmailSent(true);
      setStep('code');
      setCodeExpiresAt(Date.now() + 5 * 60 * 1000); // 5분
      setResendCount(1);
      setResendCooldown(60); // 1분 쿨다운
      setFailedAttempts(0);
      setIsBlocked(false);
      showToast.success('인증 코드가 새 이메일로 전송되었습니다!');
    }, 1500);
  };

  const handleResendCode = () => {
    if (resendCooldown > 0) {
      showToast.warning(`${resendCooldown}초 후에 재전송할 수 있습니다`);
      return;
    }

    if (resendCount >= 3) {
      showToast.error('재전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsSubmitting(true);

    // 실제로는 인증 코드 재전송 API 호출
    setTimeout(() => {
      setIsSubmitting(false);
      setCodeExpiresAt(Date.now() + 5 * 60 * 1000); // 5분
      setResendCount((prev) => prev + 1);
      setResendCooldown(60); // 1분 쿨다운
      setFailedAttempts(0);
      setIsBlocked(false);
      setFormData({ ...formData, verificationCode: '' });
      showToast.success('인증 코드가 재전송되었습니다!');
    }, 1000);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      showToast.error('인증 코드를 재전송해주세요');
      return;
    }

    setIsSubmitting(true);

    // 실제로는 인증 코드 확인 API 호출
    setTimeout(() => {
      setIsSubmitting(false);

      const isCorrect = formData.verificationCode === '123456'; // 테스트용

      if (!isCorrect && failedAttempts < 4) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        showToast.error(`인증 코드가 올바르지 않습니다 (${newAttempts}/5)`);

        if (newAttempts >= 5) {
          setIsBlocked(true);
          showToast.error('인증 실패 횟수를 초과했습니다. 인증 코드를 재전송해주세요.');
        }
        return;
      }

      showToast.success('이메일이 성공적으로 변경되었습니다!');
      navgate('/profile');
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">이메일 변경</h1>
          <p className="text-muted-foreground">보안을 위해 본인 확인이 필요합니다</p>
        </div>
      </div>

      {/* 진행 상태 */}
      <Card className="p-4">
        <div className="flex items-center justify-between relative">
          {/* 진행 바 */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-muted -z-10">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: step === 'verify' ? '0%' : '100%' }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'verify'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {step === 'verify' ? (
                <Lock className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <span className="font-medium">비밀번호 확인</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'code'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <span
              className={`font-medium ${step === 'code' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              이메일 인증
            </span>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSendCode}>
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">비밀번호 확인</h2>
                  <p className="text-sm text-muted-foreground">
                    현재 비밀번호와 변경할 새 이메일 주소를 입력하세요
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 현재 비밀번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      현재 비밀번호 <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="현재 비밀번호를 입력하세요"
                        className="pl-10 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 새 이메일 */}
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">
                      새 이메일 <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newEmail"
                        name="newEmail"
                        type="email"
                        value={formData.newEmail}
                        onChange={handleChange}
                        placeholder="새 이메일 주소를 입력하세요"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 안내 사항 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>안내:</strong> 새 이메일로 인증 코드가 전송됩니다. 인증 코드를 입력하여
                    이메일 변경을 완료하세요.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? '전송 중...' : '인증 코드 받기'}
                  </Button>
                  <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
                    <Link to="/profile">취소</Link>
                  </Button>
                </div>
              </Card>
            </form>
          </motion.div>
        )}

        {step === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleVerifyCode}>
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">이메일 인증</h2>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{formData.newEmail}</span>로 전송된
                    인증 코드를 입력하세요
                  </p>
                </div>

                <div className="space-y-3">
                  {/* 만료 시간 표시 */}
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      timeRemaining > 60
                        ? 'bg-green-50 border border-green-200'
                        : timeRemaining > 0
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <Clock
                      className={`w-5 h-5 ${
                        timeRemaining > 60
                          ? 'text-green-600'
                          : timeRemaining > 0
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          timeRemaining > 60
                            ? 'text-green-800'
                            : timeRemaining > 0
                              ? 'text-yellow-800'
                              : 'text-red-800'
                        }`}
                      >
                        {timeRemaining > 0
                          ? `남은 시간: ${formatTime(timeRemaining)}`
                          : '인증 코드가 만료되었습니다'}
                      </p>
                      <p
                        className={`text-xs ${
                          timeRemaining > 60
                            ? 'text-green-600'
                            : timeRemaining > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        인증 코드는 5분간 유효합니다
                      </p>
                    </div>
                  </div>

                  {/* 실패 횟수 표시 */}
                  {failedAttempts > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">
                          인증 실패 {failedAttempts}/5회
                        </p>
                        <p className="text-xs text-red-600">
                          5회 실패 시 인증 코드를 재전송해야 합니다
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* 차단 상태 표시 */}
                  {isBlocked && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">
                          {timeRemaining === 0
                            ? '인증 코드가 만료되었습니다'
                            : '인증 실패 횟수를 초과했습니다'}
                        </p>
                        <p className="text-xs text-red-600">인증 코드를 재전송해주세요</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* 인증 코드 */}
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">
                      인증 코드 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      placeholder="6자리 인증 코드"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono"
                      disabled={isBlocked}
                      required
                    />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">인증 코드를 받지 못하셨나요?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-primary/10 border-primary/30 hover:bg-primary/20 font-medium"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || resendCount >= 3}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    인증 코드 재전송
                    {resendCooldown > 0 && ` (${resendCooldown}초 대기)`}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    재전송 {resendCount}/3회 (1분당 3회 제한)
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={isSubmitting || isBlocked}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isSubmitting ? '확인 중...' : '인증 완료'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('verify')}
                    className="flex-1 bg-transparent"
                  >
                    이전으로
                  </Button>
                </div>
              </Card>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
